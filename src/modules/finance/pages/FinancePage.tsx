import {
  ITAlert,
  ITBadget,
  ITButton,
  ITChip,
  ITCard,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITProgress,
  ITSearchSelect,
  ITSegmentedControl,
  ITSkeleton,
  ITText,
} from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import { getPropertiesList, Property } from "@modules/properties/service/properties.service";
import { getResidentsList, ResidentUser } from "@modules/residents/services/residents.service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import dayjs from "dayjs";
import { FaBan, FaCalendarPlus, FaCog, FaEdit, FaExclamationTriangle, FaFileInvoiceDollar, FaMoneyBillWave, FaPlay, FaPlus, FaSearch, FaSync, FaUndo, FaWallet } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { ChargeFormDialog } from "../components/ChargeFormDialog";
import { MonthlyChargesDialog } from "../components/MonthlyChargesDialog";
import { PaymentFormDialog, PaymentPreset } from "../components/PaymentFormDialog";
import { ReasonDialog } from "../components/ReasonDialog";
import { CollectionConfigDialog } from "../components/CollectionConfigDialog";
import { DelinquencyRuleCard } from "../components/DelinquencyRuleCard";
import { LottieLoader } from "@app/core/components/LottieLoader";
import {
  cancelCharge,
  ChargeRow,
  downloadPaymentReceipt,
  ChargeStatus,
  CHARGE_CATEGORY_LABELS,
  CHARGE_STATUS_LABELS,
  FinanceSummary,
  getCharges,
  getFinanceSummary,
  getPayments,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  PaymentRow,
  voidPayment,
} from "../services/finance.service";
import {
  COLLECTION_FREQUENCY_LABELS,
  CollectionConfigRow,
  LATE_FEE_LABELS,
  applyLateFees,
  generateCollectionCharges,
  getCollectionConfigs,
  updateCollectionConfig,
} from "../services/collection.service";
import { formatDateOnly } from "../utils/date";
import { money } from "../utils/money";

type Tab = "charges" | "payments" | "balances" | "collections";

const TABS = [
  { value: "charges", label: "Cargos", icon: <FaFileInvoiceDollar size={12} /> },
  { value: "payments", label: "Pagos", icon: <FaMoneyBillWave size={12} /> },
  { value: "balances", label: "Saldos", icon: <FaWallet size={12} /> },
  { value: "collections", label: "Cobranza", icon: <FaCog size={12} /> },
];

const CHARGE_STATUS_OPTIONS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PENDING", label: "Pendientes" },
  { value: "PARTIAL", label: "Parciales" },
  { value: "PAID", label: "Pagados" },
  { value: "CANCELLED", label: "Cancelados" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "ALL", label: "Todos los métodos" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "AJUSTE", label: "Ajuste" },
];

const chargeBadget = (status: ChargeStatus) => {
  if (status === "PAID") return "success" as const;
  if (status === "CANCELLED") return "gray" as const;
  return "warning" as const;
};

type KpiTone = "green" | "blue" | "amber" | "red" | "violet" | "mint";

const TONE_ICON: Record<KpiTone, string> = {
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  red: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
  mint: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400",
};

const TONE_PROGRESS: Record<KpiTone, "success" | "info" | "warning" | "danger" | "purple" | "primary"> = {
  green: "success",
  blue: "info",
  amber: "warning",
  red: "danger",
  violet: "purple",
  mint: "success",
};

const FinanceKpi = ({
  title,
  value,
  hint,
  progress,
  icon,
  tone,
  loading,
  onClick,
}: {
  title: string;
  value?: string | number;
  hint?: string;
  progress?: number;
  icon: React.ReactNode;
  tone: KpiTone;
  loading: boolean;
  onClick?: () => void;
}) => {
  if (loading) return <ITSkeleton variant="rectangular" height={118} className="rounded-2xl" />;

  return (
    <ITCard onClick={onClick} className="h-full rounded-3xl border border-slate-200 shadow-sm" contentClassName="p-4!">
      <ITFlex align="center" justify="between" gap={2}>
        <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </ITText>
        <ITFlex align="center" justify="center" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_ICON[tone]}`}>
          {icon}
        </ITFlex>
      </ITFlex>
      <ITText as="p" className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</ITText>
      {hint && <ITText as="p" className="mt-1 text-[10px] font-medium leading-snug text-slate-500 dark:text-slate-400">{hint}</ITText>}
      {progress !== undefined && <ITProgress value={progress} max={100} color={TONE_PROGRESS[tone]} size="sm" className="mt-3" />}
    </ITCard>
  );
};

const FinancePage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>("charges");
  const [properties, setProperties] = useState<Property[]>([]);
  const [residents, setResidents] = useState<ResidentUser[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [chargeStatus, setChargeStatus] = useState<"ALL" | ChargeStatus>("ALL");
  const [paymentMethod, setPaymentMethod] = useState<"ALL" | PaymentMethod>("ALL");
  const [chargeOpen, setChargeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [chargeToCancel, setChargeToCancel] = useState<ChargeRow | null>(null);
  const [paymentToVoid, setPaymentToVoid] = useState<PaymentRow | null>(null);
  const [paymentPreset, setPaymentPreset] = useState<PaymentPreset | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collectionToEdit, setCollectionToEdit] = useState<CollectionConfigRow | null>(null);
  const [collectionBusy, setCollectionBusy] = useState<number | null>(null);

  const loadCatalogsAndSummary = useCallback(async () => {
    setSummaryLoading(true);
    const [propertiesRes, residentsRes] = await Promise.all([
      getPropertiesList().catch(() => null),
      getResidentsList().catch(() => null),
    ]);
    if (propertiesRes?.success && propertiesRes.data) setProperties(propertiesRes.data);
    if (residentsRes?.success && residentsRes.data) setResidents(residentsRes.data);

    try {
      const result = await getFinanceSummary();
      setSummary(result);
      setSummaryError(null);
      setUpdatedAt(new Date());
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "No se pudo cargar el resumen.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogsAndSummary();
  }, [loadCatalogsAndSummary, refreshKey]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCharges = useCallback(async (params: any) => {
    try {
      const result = await getCharges(params);
      setTableError(null);
      return result;
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "No se pudieron cargar los cargos.");
      return { data: [], total: 0 };
    }
  }, []);

  const fetchPayments = useCallback(async (params: any) => {
    try {
      const result = await getPayments(params);
      setTableError(null);
      return result;
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "No se pudieron cargar los pagos.");
      return { data: [], total: 0 };
    }
  }, []);

  const fetchBalances = useCallback(async (params: any) => {
    const all = summary?.items ?? [];
    const limit = Number(params?.limit) || 50;
    const page = Number(params?.page) || 1;
    const start = (page - 1) * limit;
    return { data: all.slice(start, start + limit), total: all.length };
  }, [summary]);

  const fetchCollections = useCallback(async () => {
    try {
      const rows = await getCollectionConfigs();
      setTableError(null);
      return { data: rows, total: rows.length };
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "No se pudo cargar la cobranza.");
      return { data: [], total: 0 };
    }
  }, []);

  const handleGenerateCharges = async (propertyId?: number) => {
    setCollectionBusy(propertyId ?? -1);
    try {
      const result = await generateCollectionCharges(propertyId ? { propertyId } : {});
      dispatch(
        showToast({
          message: `Cargos generados: ${result.created}. Omitidos: ${result.skipped}.`,
          type: "success",
        }),
      );
      setRefreshKey((key) => key + 1);
    } catch (error) {
      dispatch(showToast({ message: error instanceof Error ? error.message : "No se pudieron generar los cargos.", type: "error" }));
    } finally {
      setCollectionBusy(null);
    }
  };

  const handleApplyLateFees = async (propertyId?: number) => {
    setCollectionBusy(propertyId ?? -2);
    try {
      const result = await applyLateFees(propertyId ? { propertyId } : {});
      dispatch(
        showToast({
          message: `Recargos generados: ${result.created}. Omitidos: ${result.skipped}.`,
          type: "success",
        }),
      );
      setRefreshKey((key) => key + 1);
    } catch (error) {
      dispatch(showToast({ message: error instanceof Error ? error.message : "No se pudieron aplicar los recargos.", type: "error" }));
    } finally {
      setCollectionBusy(null);
    }
  };

  const toggleCollection = async (row: CollectionConfigRow) => {
    setCollectionBusy(row.id);
    try {
      await updateCollectionConfig(row.id, { active: !row.active });
      dispatch(showToast({ message: row.active ? "Cobranza desactivada." : "Cobranza activada.", type: "success" }));
      setRefreshKey((key) => key + 1);
    } catch (error) {
      dispatch(showToast({ message: error instanceof Error ? error.message : "No se pudo actualizar la cobranza.", type: "error" }));
    } finally {
      setCollectionBusy(null);
    }
  };

  const chargeFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(chargeStatus !== "ALL" ? { status: chargeStatus } : {}),
    }),
    [chargeStatus, debouncedSearch],
  );

  const paymentFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(paymentMethod !== "ALL" ? { method: paymentMethod } : {}),
    }),
    [debouncedSearch, paymentMethod],
  );

  const chargeColumns = useMemo(
    () => [
      {
        key: "property",
        label: "Propiedad",
        width: 190,
        render: (row: ChargeRow) => (
          <ITFlex direction="column" className="min-w-0">
            <ITText as="span" className="truncate text-xs font-bold text-slate-800">
              {row.property?.identifier ?? "—"}
            </ITText>
            <ITText as="span" className="truncate text-[10px] text-slate-400">
              {row.property?.name ?? ""}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "resident",
        label: "Residente",
        width: 160,
        render: (row: ChargeRow) => (
          <ITText as="span" className="truncate text-xs text-slate-600">
            {row.resident ? `${row.resident.name} ${row.resident.lastName ?? ""}`.trim() : "—"}
          </ITText>
        ),
      },
      {
        key: "concept",
        label: "Concepto",
        width: 240,
        render: (row: ChargeRow) => (
          <ITFlex direction="column" className="min-w-0">
            <ITText as="span" className="truncate text-xs font-semibold text-slate-800">{row.concept}</ITText>
            <ITText as="span" className="text-[10px] text-slate-400">
              {CHARGE_CATEGORY_LABELS[row.category]}
              {row.period ? ` · ${row.period}` : ""}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "dueDate",
        label: "Vence",
        width: 105,
        render: (row: ChargeRow) => (
          <ITText as="span" className="text-xs text-slate-600">{formatDateOnly(row.dueDate)}</ITText>
        ),
      },
      {
        key: "amount",
        label: "Monto",
        width: 100,
        render: (row: ChargeRow) => (
          <ITText as="span" className="text-xs font-bold text-slate-800">{money(row.amount)}</ITText>
        ),
      },
      {
        key: "paid",
        label: "Pagado",
        width: 100,
        render: (row: ChargeRow) => (
          <ITText as="span" className="text-xs text-slate-600">{money(row.paidAmount)}</ITText>
        ),
      },
      {
        key: "outstanding",
        label: "Saldo",
        width: 100,
        render: (row: ChargeRow) => (
          <ITText as="span" className={row.outstanding > 0 ? "text-xs font-bold text-amber-600" : "text-xs text-slate-400"}>
            {money(row.outstanding)}
          </ITText>
        ),
      },
      {
        key: "status",
        label: "Estado",
        width: 110,
        render: (row: ChargeRow) => (
          <ITBadget color={chargeBadget(row.status)} size="sm" variant="filled">
            {CHARGE_STATUS_LABELS[row.status]}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        width: 270,
        render: (row: ChargeRow) => (
          <ITFlex align="center" gap={1} wrap="wrap">
            <ITButton
              label="Pagar cargo"
              size="sm"
              icon={<FaMoneyBillWave />}
              disabled={row.status === "CANCELLED" || row.status === "PAID" || row.outstanding <= 0}
              onClick={() => {
                setPaymentPreset({
                  propertyId: row.propertyId,
                  residentId: row.residentId,
                  amount: row.outstanding > 0 ? row.outstanding : row.amount,
                  chargeId: row.id,
                  concept: row.concept,
                });
                setPaymentOpen(true);
              }}
            />
            <ITButton
              label="Cancelar"
              size="sm"
              variant="outlined"
              color="danger"
              icon={<FaBan />}
              disabled={row.status === "CANCELLED" || row.paidAmount > 0}
              onClick={() => setChargeToCancel(row)}
            />
          </ITFlex>
        ),
      },
    ],
    [],
  );

  const paymentColumns = useMemo(
    () => [
      {
        key: "paidAt",
        label: "Fecha",
        width: 105,
        render: (row: PaymentRow) => (
          <ITText as="span" className="text-xs text-slate-600">{formatDateOnly(row.paidAt)}</ITText>
        ),
      },
      {
        key: "folio",
        label: "Folio",
        width: 80,
        render: (row: PaymentRow) => (
          <ITText as="span" className="text-xs font-bold text-slate-700">
            {row.folio ? String(row.folio).padStart(6, "0") : "—"}
          </ITText>
        ),
      },
      {
        key: "property",
        label: "Propiedad",
        width: 160,
        render: (row: PaymentRow) => (
          <ITText as="span" className="truncate text-xs font-semibold text-slate-800">
            {row.property?.identifier ?? "—"}
          </ITText>
        ),
      },
      {
        key: "resident",
        label: "Residente",
        width: 160,
        render: (row: PaymentRow) => (
          <ITText as="span" className="truncate text-xs text-slate-600">
            {row.resident ? `${row.resident.name} ${row.resident.lastName ?? ""}`.trim() : "—"}
          </ITText>
        ),
      },
      {
        key: "method",
        label: "Método",
        width: 120,
        render: (row: PaymentRow) => (
          <ITText as="span" className="text-xs text-slate-600">{PAYMENT_METHOD_LABELS[row.method]}</ITText>
        ),
      },
      {
        key: "reference",
        label: "Referencia",
        width: 150,
        render: (row: PaymentRow) => (
          <ITText as="span" className="truncate text-xs text-slate-500">{row.reference ?? "—"}</ITText>
        ),
      },
      {
        key: "amount",
        label: "Monto",
        width: 100,
        render: (row: PaymentRow) => (
          <ITText as="span" className="text-xs font-bold text-slate-800">{money(row.amount)}</ITText>
        ),
      },
      {
        key: "applied",
        label: "Aplicado",
        width: 100,
        render: (row: PaymentRow) => (
          <ITText as="span" className="text-xs text-slate-600">{money(row.allocatedAmount)}</ITText>
        ),
      },
      {
        key: "credit",
        label: "Crédito",
        width: 100,
        render: (row: PaymentRow) => (
          <ITText as="span" className={row.unallocatedAmount > 0 ? "text-xs font-bold text-emerald-600" : "text-xs text-slate-400"}>
            {money(row.unallocatedAmount)}
          </ITText>
        ),
      },
      {
        key: "status",
        label: "Estado",
        width: 105,
        render: (row: PaymentRow) => (
          <ITBadget color={row.voidedAt ? "gray" : "success"} size="sm" variant="filled">
            {row.voidedAt ? "Reversado" : "Vigente"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        width: 200,
        render: (row: PaymentRow) => (
          <ITFlex align="center" gap={1} wrap="wrap">
            <ITButton
              label="Recibo"
              size="sm"
              variant="outlined"
              icon={<FaFileInvoiceDollar />}
              onClick={() => void handleReceipt(row)}
            />
            <ITButton
              label="Reversar"
              size="sm"
              variant="outlined"
              color="danger"
              icon={<FaUndo />}
              disabled={!!row.voidedAt}
              onClick={() => setPaymentToVoid(row)}
            />
          </ITFlex>
        ),
      },
    ],
    [],
  );

  const balanceColumns = useMemo(
    () => [
      {
        key: "property",
        label: "Propiedad",
        render: (row: any) => (
          <ITFlex direction="column" className="min-w-0">
            <ITText as="span" className="truncate text-xs font-bold text-slate-800">{row.identifier}</ITText>
            <ITText as="span" className="truncate text-[10px] text-slate-400">{row.name}</ITText>
          </ITFlex>
        ),
      },
      {
        key: "residents",
        label: "Residentes",
        render: (row: any) => <ITText as="span" className="text-xs text-slate-600">{row.residents}</ITText>,
      },
      {
        key: "totalCharges",
        label: "Cargos",
        render: (row: any) => <ITText as="span" className="text-xs text-slate-600">{money(row.totalCharges)}</ITText>,
      },
      {
        key: "totalPaid",
        label: "Pagado",
        render: (row: any) => <ITText as="span" className="text-xs text-slate-600">{money(row.totalPaid)}</ITText>,
      },
      {
        key: "balance",
        label: "Saldo",
        render: (row: any) => (
          <ITText as="span" className={row.balance > 0 ? "text-xs font-bold text-amber-600" : "text-xs font-bold text-emerald-600"}>
            {money(row.balance)}
          </ITText>
        ),
      },
      {
        key: "pendingCharges",
        label: "Pendientes",
        render: (row: any) => <ITText as="span" className="text-xs text-slate-600">{row.pendingCharges}</ITText>,
      },
    ],
    [],
  );

  const collectionColumns = useMemo(
    () => [
      {
        key: "property",
        label: "Propiedad",
        width: 190,
        render: (row: CollectionConfigRow) => (
          <ITFlex direction="column" className="min-w-0">
            <ITText as="span" className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
              {row.property?.identifier ?? "—"}
            </ITText>
            <ITText as="span" className="truncate text-[10px] text-slate-400">{row.property?.name ?? ""}</ITText>
          </ITFlex>
        ),
      },
      {
        key: "concept",
        label: "Concepto",
        width: 180,
        render: (row: CollectionConfigRow) => (
          <ITText as="span" className="truncate text-xs text-slate-600 dark:text-slate-300">{row.concept}</ITText>
        ),
      },
      {
        key: "frequency",
        label: "Periodicidad",
        width: 120,
        render: (row: CollectionConfigRow) => (
          <ITBadget color="primary" size="sm" variant="filled">{COLLECTION_FREQUENCY_LABELS[row.frequency]}</ITBadget>
        ),
      },
      {
        key: "amount",
        label: "Cuota",
        width: 100,
        render: (row: CollectionConfigRow) => (
          <ITText as="span" className="text-xs font-bold text-slate-800 dark:text-slate-100">{money(row.amount)}</ITText>
        ),
      },
      {
        key: "dueDay",
        label: "Vence",
        width: 75,
        render: (row: CollectionConfigRow) => (
          <ITText as="span" className="text-xs text-slate-600 dark:text-slate-300">Día {row.dueDay}</ITText>
        ),
      },
      {
        key: "nextChargeDate",
        label: "Próximo cobro",
        width: 110,
        render: (row: CollectionConfigRow) => (
          <ITText as="span" className="text-xs text-slate-600 dark:text-slate-300">{formatDateOnly(row.nextChargeDate)}</ITText>
        ),
      },
      {
        key: "lateFee",
        label: "Recargo",
        width: 130,
        render: (row: CollectionConfigRow) => (
          <ITFlex direction="column" className="min-w-0">
            <ITText as="span" className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {row.lateFeeType === "NONE"
                ? "Sin recargo"
                : `${LATE_FEE_LABELS[row.lateFeeType]} ${row.lateFeeType === "PERCENT" ? `${row.lateFeeValue}%` : money(row.lateFeeValue)}`}
            </ITText>
            {row.lateFeeType !== "NONE" && (
              <ITText as="span" className="text-[9px] text-slate-400">Gracia {row.graceDays} días</ITText>
            )}
          </ITFlex>
        ),
      },
      {
        key: "status",
        label: "Estado",
        width: 90,
        render: (row: CollectionConfigRow) => (
          <ITBadget color={row.active ? "success" : "gray"} size="sm" variant="filled">
            {row.active ? "Activa" : "Inactiva"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        width: 230,
        render: (row: CollectionConfigRow) => (
          <ITFlex align="center" gap={1} wrap="wrap">
            <ITButton
              size="sm"
              variant="icon-only"
              color="primary"
              icon={<FaEdit />}
              ariaLabel="Editar cobranza"
              title="Editar cobranza"
              onClick={() => {
                setCollectionToEdit(row);
                setCollectionOpen(true);
              }}
            />
            <ITButton
              size="sm"
              variant="icon-only"
              color="primary"
              icon={<FaPlay />}
              ariaLabel="Generar cargos de esta propiedad"
              title="Generar cargos de esta propiedad"
              disabled={!row.active || collectionBusy !== null}
              onClick={() => void handleGenerateCharges(row.propertyId)}
            />
            <ITButton
              size="sm"
              variant="outlined"
              disabled={collectionBusy !== null}
              onClick={() => void toggleCollection(row)}
            >
              {row.active ? "Desactivar" : "Activar"}
            </ITButton>
          </ITFlex>
        ),
      },
    ],
    [collectionBusy],
  );

  const handleReceipt = async (row: PaymentRow) => {
    const result = await downloadPaymentReceipt(row.id);
    dispatch(
      showToast({
        message: result.success ? "Recibo descargado" : result.messages?.[0] ?? "No se pudo descargar el recibo",
        type: result.success ? "success" : "error",
      }),
    );
  };

  const totals = summary?.totals;
  const firstName = auth.name?.trim().split(/\s+/)[0] || "equipo";
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const hour = dayjs().hour();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateLabel = dayjs().format("dddd, D [de] MMMM");
  const dateCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
  const collectedProgress = totals?.totalCharges
    ? Math.max(0, Math.min(100, Math.round((totals.totalPaid / totals.totalCharges) * 100)))
    : 0;
  const balanceProgress = totals?.totalCharges
    ? Math.max(0, Math.min(100, Math.round((totals.balance / totals.totalCharges) * 100)))
    : 0;
  const pendingCharges = summary?.items.reduce((sum, item) => sum + item.pendingCharges, 0) ?? 0;

  return (
    <ITPage
      noPadding
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50 mb-8"
      title={`${greeting}, ${displayName}`}
      description={`${dateCap} · Cargos, pagos y cobranza del residencial.`}
      icon={<FaWallet />}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITChip label="Finanzas" color="primary" size="sm" variant="soft" icon={<FaWallet size={10} />} />
          <ITText as="span" className="text-[10px] font-semibold text-slate-500">
            {updatedAt ? `Actualizado ${dayjs(updatedAt).format("HH:mm:ss")}` : "Cargando…"}
          </ITText>
          <ITButton
            variant="icon-only"
            color="secondary"
            size="sm"
            icon={<FaSync size={13} className={summaryLoading ? "animate-spin" : ""} />}
            ariaLabel="Actualizar finanzas"
            onClick={() => setRefreshKey((key) => key + 1)}
          />
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={5} className="w-full pb-10 pt-5">
        {summaryError && (
          <ITAlert variant="error" title="No se pudo cargar el resumen de finanzas">
            {summaryError}
          </ITAlert>
        )}

        <ITFlex align="center" gap={4} wrap="wrap" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <ITFlex direction="column" align="center" justify="center" className="h-16 w-16 shrink-0 rounded-2xl bg-primary-700">
            <ITText as="span" className="text-[8px] font-black uppercase tracking-widest text-white/70!">
              {dayjs().format("MMM")}
            </ITText>
            <ITText as="strong" className="text-2xl font-black leading-none text-white!">
              {dayjs().format("D")}
            </ITText>
            <ITText as="span" className="text-[8px] font-black uppercase tracking-widest text-white/70!">
              {dayjs().format("ddd")}
            </ITText>
          </ITFlex>

          <ITFlex align="center" gap={6} wrap="wrap">
            <ITFlex direction="column">
              <ITText as="strong" className="text-xl font-black tracking-tight text-slate-900">
                {summaryLoading ? "—" : money(totals?.totalCharges ?? 0)}
              </ITText>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                cargos registrados
              </ITText>
            </ITFlex>
            <ITFlex direction="column">
              <ITText as="strong" className="text-xl font-black tracking-tight text-slate-900">
                {summaryLoading ? "—" : money(totals?.totalPaid ?? 0)}
              </ITText>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                cobrado
              </ITText>
            </ITFlex>
            <ITFlex direction="column">
              <ITText as="strong" className="text-xl font-black tracking-tight text-slate-900">
                {summaryLoading ? "—" : money(totals?.balance ?? 0)}
              </ITText>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                saldo total
              </ITText>
            </ITFlex>
            <ITFlex direction="column">
              <ITText as="strong" className="text-xl font-black tracking-tight text-slate-900">
                {totals?.properties ?? properties.length}
              </ITText>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                propiedades
              </ITText>
            </ITFlex>
          </ITFlex>

          <ITFlex align="center" gap={2} wrap="wrap" className="ml-auto">
            <ITButton
              color="primary"
              variant="filled"
              size="sm"
              onClick={() => {
                setPaymentPreset(null);
                setPaymentOpen(true);
              }}
            >
              <ITFlex align="center" gap={1}>
                <FaMoneyBillWave size={11} />
                <ITText as="span">Registrar pago</ITText>
              </ITFlex>
            </ITButton>
            <ITButton color="secondary" variant="outlined" size="sm" onClick={() => setChargeOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={10} />
                <ITText as="span">Nuevo cargo</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} sm={6} xl={3}>
            <FinanceKpi
              title="Cargos registrados"
              value={money(totals?.totalCharges ?? 0)}
              hint={`${properties.length} propiedades`}
              icon={<FaFileInvoiceDollar />}
              tone="blue"
              loading={summaryLoading}
              onClick={() => setTab("charges")}
            />
          </ITGrid>
          <ITGrid item xs={12} sm={6} xl={3}>
            <FinanceKpi
              title="Cobrado"
              value={money(totals?.totalPaid ?? 0)}
              hint={`${collectedProgress}% de lo registrado`}
              progress={collectedProgress}
              icon={<FaMoneyBillWave />}
              tone="green"
              loading={summaryLoading}
              onClick={() => setTab("payments")}
            />
          </ITGrid>
          <ITGrid item xs={12} sm={6} xl={3}>
            <FinanceKpi
              title="Saldo total"
              value={money(totals?.balance ?? 0)}
              hint={`${pendingCharges} ${pendingCharges === 1 ? "cargo pendiente" : "cargos pendientes"}`}
              progress={balanceProgress}
              icon={<FaWallet />}
              tone="amber"
              loading={summaryLoading}
              onClick={() => setTab("balances")}
            />
          </ITGrid>
          <ITGrid item xs={12} sm={6} xl={3}>
            <FinanceKpi
              title="Propiedades"
              value={totals?.properties ?? properties.length}
              hint={`${residents.length} residentes registrados`}
              icon={<FaFileInvoiceDollar />}
              tone="violet"
              loading={summaryLoading}
              onClick={() => setTab("balances")}
            />
          </ITGrid>
        </ITGrid>

        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
          <ITSegmentedControl
            size="sm"
            options={TABS}
            value={tab}
            onChange={(value) => {
              setTab(value as Tab);
              setTableError(null);
            }}
          />
          <ITText as="span" className="text-[10px] font-semibold text-slate-500">
            {tab === "charges"
              ? "Cargos, cuotas y cobro por propiedad"
              : tab === "payments"
                ? "Pagos recibidos y recibos"
                : tab === "balances"
                  ? "Saldo consolidado por propiedad"
                  : "Periodicidad y recargos por propiedad"}
          </ITText>
        </ITFlex>

        <ITFlex align="end" gap={2} wrap="wrap" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {tab !== "collections" && (
            <ITFlex className="min-w-[240px]! flex-1!">
              <ITInput
                name="finance-search"
                label="Buscar"
                placeholder="Concepto, residente o propiedad"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                iconLeft={<FaSearch />}
              />
            </ITFlex>
          )}

          {tab === "charges" && (
            <>
              <ITFlex className="w-[220px]!">
                <ITSearchSelect
                  name="charge-status"
                  label="Estado"
                  options={CHARGE_STATUS_OPTIONS}
                  value={chargeStatus}
                  onChange={(value) => setChargeStatus(String(value) as "ALL" | ChargeStatus)}
                  clearable={false}
                />
              </ITFlex>
              <ITButton label="Generar cuotas" variant="outlined" icon={<FaCalendarPlus />} onClick={() => setMonthlyOpen(true)} />
            </>
          )}

          {tab === "payments" && (
            <>
              <ITFlex className="w-[220px]!">
                <ITSearchSelect
                  name="payment-method"
                  label="Método"
                  options={PAYMENT_METHOD_OPTIONS}
                  value={paymentMethod}
                  onChange={(value) => setPaymentMethod(String(value) as "ALL" | PaymentMethod)}
                  clearable={false}
                />
              </ITFlex>
            </>
          )}

          {tab === "collections" && (
            <>
              <ITButton
                label="Nueva configuración"
                icon={<FaPlus />}
                onClick={() => {
                  setCollectionToEdit(null);
                  setCollectionOpen(true);
                }}
              />
              <ITButton
                label="Generar cargos"
                variant="outlined"
                icon={<FaPlay />}
                disabled={collectionBusy !== null}
                onClick={() => void handleGenerateCharges()}
              />
              <ITButton
                label="Aplicar recargos"
                variant="outlined"
                color="warning"
                icon={<FaExclamationTriangle />}
                disabled={collectionBusy !== null}
                onClick={() => void handleApplyLateFees()}
              />
            </>
          )}
        </ITFlex>

        {tableError && (
          <ITAlert variant="error" title="No se pudieron cargar los datos">
            {tableError}
          </ITAlert>
        )}

        {tab === "charges" && (
          <ITCard className="rounded-3xl border border-slate-200 shadow-sm" contentClassName="p-0!">
            <ITDataTable
              key={`charges-${refreshKey}`}
              fetchData={fetchCharges as any}
              columns={chargeColumns as any}
              defaultItemsPerPage={25}
              itemsPerPageOptions={[25, 50, 100]}
              layout="fixed"
              density="compact"
              rowHeight={50}
              virtualized
              virtualizedMaxHeight={460}
              externalFilters={chargeFilters as any}
            />
          </ITCard>
        )}

        {tab === "payments" && (
          <ITCard className="rounded-3xl border border-slate-200 shadow-sm" contentClassName="p-0!">
            <ITDataTable
              key={`payments-${refreshKey}`}
              fetchData={fetchPayments as any}
              columns={paymentColumns as any}
              defaultItemsPerPage={25}
              itemsPerPageOptions={[25, 50, 100]}
              layout="fixed"
              density="compact"
              rowHeight={50}
              virtualized
              virtualizedMaxHeight={460}
              externalFilters={paymentFilters as any}
            />
          </ITCard>
        )}

        {tab === "balances" && (
          <ITCard className="rounded-3xl border border-slate-200 shadow-sm" contentClassName="p-0!">
            <ITDataTable
              key={`balances-${refreshKey}-${summary?.items.length ?? 0}`}
              fetchData={fetchBalances as any}
              columns={balanceColumns as any}
              defaultItemsPerPage={50}
              itemsPerPageOptions={[50, 100]}
              layout="fixed"
              density="compact"
              rowHeight={50}
            />
          </ITCard>
        )}

        {tab === "collections" && <DelinquencyRuleCard properties={properties} />}

        {tab === "collections" && (
          <ITCard className="rounded-3xl border border-slate-200 shadow-sm" contentClassName="p-0!">
            <ITDataTable
              key={`collections-${refreshKey}`}
              fetchData={fetchCollections as any}
              columns={collectionColumns as any}
              defaultItemsPerPage={25}
              itemsPerPageOptions={[25, 50, 100]}
              layout="fixed"
              density="compact"
              rowHeight={54}
              virtualized
              virtualizedMaxHeight={520}
            />
          </ITCard>
        )}
      </ITFlex>

      <ChargeFormDialog
        isOpen={chargeOpen}
        onClose={() => setChargeOpen(false)}
        onSaved={() => setRefreshKey((key) => key + 1)}
        properties={properties}
        residents={residents}
      />

      <PaymentFormDialog
        isOpen={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          setPaymentPreset(null);
        }}
        onSaved={() => setRefreshKey((key) => key + 1)}
        properties={properties}
        residents={residents}
        preset={paymentPreset}
      />

      <MonthlyChargesDialog
        isOpen={monthlyOpen}
        onClose={() => setMonthlyOpen(false)}
        onSaved={() => setRefreshKey((key) => key + 1)}
      />

      <CollectionConfigDialog
        isOpen={collectionOpen}
        onClose={() => {
          setCollectionOpen(false);
          setCollectionToEdit(null);
        }}
        onSaved={() => setRefreshKey((key) => key + 1)}
        properties={properties}
        config={collectionToEdit}
      />

      <ITDialog
        isOpen={collectionBusy !== null}
        onClose={() => undefined}
        title="Procesando cobranza"
        className="w-[440px] max-w-[95vw]"
      >
        <ITFlex align="center" justify="center" className="p-4">
          <LottieLoader
            label={
              collectionBusy === -1
                ? "Generando cuotas…"
                : collectionBusy === -2
                  ? "Aplicando recargos…"
                  : "Actualizando cobranza…"
            }
            hint="Estamos procesando las propiedades. Esto puede tardar unos segundos."
            size={132}
          />
        </ITFlex>
      </ITDialog>

      <ReasonDialog
        isOpen={!!chargeToCancel}
        onClose={() => setChargeToCancel(null)}
        title="Cancelar cargo"
        message={
          chargeToCancel
            ? `Vas a cancelar “${chargeToCancel.concept}” por ${money(chargeToCancel.amount)}. El cargo dejará de contar para el saldo.`
            : ""
        }
        confirmLabel="Cancelar cargo"
        onConfirm={async (reason) => {
          if (!chargeToCancel) return;
          await cancelCharge(chargeToCancel.id, reason);
          dispatch(showToast({ message: "Cargo cancelado correctamente.", type: "success" }));
          setRefreshKey((key) => key + 1);
        }}
      />

      <ReasonDialog
        isOpen={!!paymentToVoid}
        onClose={() => setPaymentToVoid(null)}
        title="Reversar pago"
        message={
          paymentToVoid
            ? `Vas a reversar el pago de ${money(paymentToVoid.amount)}. Los cargos volverán a quedar pendientes y el movimiento quedará registrado.`
            : ""
        }
        confirmLabel="Reversar pago"
        onConfirm={async (reason) => {
          if (!paymentToVoid) return;
          await voidPayment(paymentToVoid.id, reason);
          dispatch(showToast({ message: "Pago reversado correctamente.", type: "success" }));
          setRefreshKey((key) => key + 1);
        }}
      />
    </ITPage>
  );
};

export default FinancePage;
