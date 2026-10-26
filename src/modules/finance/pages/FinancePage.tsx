import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSelect,
  ITSegmentedControl,
  ITSkeleton,
  ITStatCard,
  ITText,
} from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import { getPropertiesList, Property } from "@modules/properties/service/properties.service";
import { getResidentsList, ResidentUser } from "@modules/residents/services/residents.service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBan, FaCalendarPlus, FaFileInvoiceDollar, FaMoneyBillWave, FaPlus, FaSearch, FaSync, FaUndo, FaWallet } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { ChargeFormDialog } from "../components/ChargeFormDialog";
import { MonthlyChargesDialog } from "../components/MonthlyChargesDialog";
import { PaymentFormDialog } from "../components/PaymentFormDialog";
import { ReasonDialog } from "../components/ReasonDialog";
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
import { formatDateOnly } from "../utils/date";
import { money } from "../utils/money";

type Tab = "charges" | "payments" | "balances";

const TABS = [
  { value: "charges", label: "Cargos" },
  { value: "payments", label: "Pagos" },
  { value: "balances", label: "Saldos" },
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

const FinancePage = () => {
  const dispatch = useDispatch();
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
        width: 120,
        render: (row: ChargeRow) => (
          <ITButton
            label="Cancelar"
            size="sm"
            variant="outlined"
            color="danger"
            icon={<FaBan />}
            disabled={row.status === "CANCELLED" || row.paidAmount > 0}
            onClick={() => setChargeToCancel(row)}
          />
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

  return (
    <ITPage
      noPadding
      className="m-0! px-4! max-w-screen!"
      title="Finanzas"
      description="Cargos, pagos y saldos de las propiedades"
      icon={<FaWallet />}
      actions={
        <ITButton
          variant="outline"
          icon={<FaSync />}
          label="Refrescar"
          ariaLabel="Refrescar finanzas"
          onClick={() => setRefreshKey((key) => key + 1)}
        />
      }
    >
      <ITFlex direction="column" gap={4} className="py-4">
        {summaryError && (
          <ITAlert variant="error" title="No se pudo cargar el resumen de finanzas">
            {summaryError}
          </ITAlert>
        )}

        {summaryLoading ? (
          <ITGrid container columns={12} spacing={3}>
            {[0, 1, 2, 3].map((item) => (
              <ITGrid key={item} item xs={12} md={6} xl={3}>
                <ITSkeleton variant="rectangular" height={96} />
              </ITGrid>
            ))}
          </ITGrid>
        ) : (
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={6} xl={3}>
              <ITStatCard
                label="Cargos registrados"
                value={money(totals?.totalCharges ?? 0)}
                icon={<FaFileInvoiceDollar />}
                color="bg-sky-50 dark:bg-sky-950/20"
              />
            </ITGrid>
            <ITGrid item xs={12} md={6} xl={3}>
              <ITStatCard
                label="Cobrado"
                value={money(totals?.totalPaid ?? 0)}
                icon={<FaMoneyBillWave />}
                color="bg-emerald-50 dark:bg-emerald-950/20"
              />
            </ITGrid>
            <ITGrid item xs={12} md={6} xl={3}>
              <ITStatCard
                label="Saldo total"
                value={money(totals?.balance ?? 0)}
                icon={<FaWallet />}
                color="bg-amber-50 dark:bg-amber-950/20"
              />
            </ITGrid>
            <ITGrid item xs={12} md={6} xl={3}>
              <ITStatCard
                label="Propiedades"
                value={totals?.properties ?? 0}
                icon={<FaFileInvoiceDollar />}
                color="bg-slate-50 dark:bg-slate-900"
              />
            </ITGrid>
          </ITGrid>
        )}

        <ITCard contentClassName="p-4!">
          <ITFlex direction="column" gap={3}>
            <ITSegmentedControl
              options={TABS}
              value={tab}
              onChange={(value) => {
                setTab(value as Tab);
                setTableError(null);
              }}
            />

            <ITFlex align="center" gap={2} wrap="wrap">
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

              {tab === "charges" && (
                <>
                  <ITFlex className="w-[220px]!">
                    <ITSelect
                      name="charge-status"
                      label="Estado"
                      options={CHARGE_STATUS_OPTIONS}
                      value={chargeStatus}
                      onChange={(event) => setChargeStatus(event.target.value as "ALL" | ChargeStatus)}
                    />
                  </ITFlex>
                  <ITButton label="Nuevo cargo" icon={<FaPlus />} onClick={() => setChargeOpen(true)} />
                  <ITButton
                    label="Generar cuotas"
                    variant="outlined"
                    icon={<FaCalendarPlus />}
                    onClick={() => setMonthlyOpen(true)}
                  />
                </>
              )}

              {tab === "payments" && (
                <>
                  <ITFlex className="w-[220px]!">
                    <ITSelect
                      name="payment-method"
                      label="Método"
                      options={PAYMENT_METHOD_OPTIONS}
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value as "ALL" | PaymentMethod)}
                    />
                  </ITFlex>
                  <ITButton label="Registrar pago" icon={<FaPlus />} onClick={() => setPaymentOpen(true)} />
                </>
              )}
            </ITFlex>

            {tableError && (
              <ITAlert variant="error" title="No se pudieron cargar los datos">
                {tableError}
              </ITAlert>
            )}

            {tab === "charges" && (
              <ITCard contentClassName="p-0!">
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
              <ITCard contentClassName="p-0!">
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
              <ITCard contentClassName="p-0!">
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
          </ITFlex>
        </ITCard>
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
        onClose={() => setPaymentOpen(false)}
        onSaved={() => setRefreshKey((key) => key + 1)}
        properties={properties}
        residents={residents}
      />

      <MonthlyChargesDialog
        isOpen={monthlyOpen}
        onClose={() => setMonthlyOpen(false)}
        onSaved={() => setRefreshKey((key) => key + 1)}
      />

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
