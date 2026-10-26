import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITSkeleton,
  ITStatCard,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { FaFileInvoiceDollar, FaMoneyBillWave, FaReceipt, FaSync, FaWallet } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  CHARGE_CATEGORY_LABELS,
  CHARGE_STATUS_LABELS,
  ChargeStatus,
  PAYMENT_METHOD_LABELS,
  downloadPaymentReceipt,
  type ChargeRow,
} from "../../finance/services/finance.service";
import { formatDateOnly } from "../../finance/utils/date";
import { money } from "../../finance/utils/money";
import { getResidentFinance, type ResidentFinance, type ResidentPayment } from "../services/residents.service";

const chargeBadget = (status: ChargeStatus) => {
  if (status === "PAID") return "success";
  if (status === "PARTIAL") return "warning";
  if (status === "CANCELLED") return "gray";
  return "warning";
};

const StatCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  color: string;
}) => <ITStatCard label={label} value={value} icon={icon} color={color} />;

const ChargeLine = ({ charge }: { charge: ChargeRow }) => (
  <ITFlex
    align="center"
    justify="between"
    gap={3}
    className="border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"
  >
    <ITFlex direction="column" className="min-w-0 flex-1">
      <ITText as="p" className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
        {charge.concept}
      </ITText>
      <ITText as="p" className="text-[10px] text-slate-400">
        {CHARGE_CATEGORY_LABELS[charge.category]}
        {charge.period ? ` · ${charge.period}` : ""} · vence {formatDateOnly(charge.dueDate)}
      </ITText>
    </ITFlex>
    <ITFlex direction="column" align="end" gap={1} className="shrink-0">
      <ITText as="span" className="text-xs font-black text-slate-800 dark:text-slate-100">
        {money(charge.amount)}
      </ITText>
      <ITBadget color={chargeBadget(charge.status) as never} size="sm" variant="filled">
        {CHARGE_STATUS_LABELS[charge.status]}
      </ITBadget>
      {charge.outstanding > 0 && charge.status !== "CANCELLED" && (
        <ITText as="span" className="text-[10px] font-semibold text-amber-600">
          Saldo {money(charge.outstanding)}
        </ITText>
      )}
    </ITFlex>
  </ITFlex>
);

const PaymentLine = ({
  payment,
  onReceipt,
  busy,
}: {
  payment: ResidentPayment;
  onReceipt: (payment: ResidentPayment) => void;
  busy: boolean;
}) => (
  <ITFlex
    align="center"
    justify="between"
    gap={3}
    className="border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"
  >
    <ITFlex direction="column" className="min-w-0 flex-1">
      <ITFlex align="center" gap={2}>
        <ITText as="p" className="text-xs font-bold text-slate-800 dark:text-slate-100">
          {payment.folio ? `Folio ${String(payment.folio).padStart(6, "0")}` : "Pago registrado"}
        </ITText>
        {payment.voidedAt && (
          <ITBadget color={"gray" as never} size="sm" variant="filled">Reversado</ITBadget>
        )}
      </ITFlex>
      <ITText as="p" className="text-[10px] text-slate-400">
        {formatDateOnly(payment.paidAt)} · {PAYMENT_METHOD_LABELS[payment.method]}
        {payment.reference ? ` · ${payment.reference}` : ""}
      </ITText>
    </ITFlex>
    <ITFlex direction="column" align="end" gap={1} className="shrink-0">
      <ITText as="span" className="text-xs font-black text-slate-800 dark:text-slate-100">
        {money(payment.amount)}
      </ITText>
      {payment.appliedAmount > 0 && (
        <ITText as="span" className="text-[10px] text-slate-500">Aplicado {money(payment.appliedAmount)}</ITText>
      )}
      {(payment.credit ?? 0) > 0 && (
        <ITText as="span" className="text-[10px] font-semibold text-emerald-600">A favor {money(payment.credit ?? 0)}</ITText>
      )}
      <ITButton
        size="sm"
        variant="outlined"
        icon={<FaFileInvoiceDollar />}
        disabled={busy}
        onClick={() => onReceipt(payment)}
      >
        {busy ? "Generando…" : "Recibo"}
      </ITButton>
    </ITFlex>
  </ITFlex>
);

export const ResidentFinancePanel = ({ residentId }: { residentId: number }) => {
  const dispatch = useDispatch();
  const [data, setData] = useState<ResidentFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getResidentFinance(residentId));
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el estado de cuenta");
    } finally {
      setLoading(false);
    }
  }, [residentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadReceipt = async (payment: ResidentPayment) => {
    setReceiptId(payment.id);
    try {
      const result = await downloadPaymentReceipt(payment.id);
      dispatch(
        showToast({
          message: result.success ? "Recibo descargado" : result.messages?.[0] ?? "No se pudo descargar el recibo",
          type: result.success ? "success" : "error",
        }),
      );
    } finally {
      setReceiptId(null);
    }
  };

  if (loading) {
    return (
      <ITFlex direction="column" gap={4}>
        <ITGrid container columns={12} spacing={3}>
          {[0, 1, 2, 3].map((item) => (
            <ITGrid item xs={12} sm={6} xl={3} key={item}>
              <ITSkeleton className="h-24 w-full rounded-2xl" />
            </ITGrid>
          ))}
        </ITGrid>
        <ITSkeleton className="h-56 w-full rounded-3xl" />
        <ITSkeleton className="h-56 w-full rounded-3xl" />
      </ITFlex>
    );
  }

  if (error && !data) {
    return (
      <ITAlert variant="error" title="No se pudo cargar el estado de cuenta">
        <ITFlex direction="column" gap={3}>
          <ITText as="p" className="text-xs">{error}</ITText>
          <ITFlex>
            <ITButton size="sm" variant="outlined" icon={<FaSync />} onClick={() => void load()}>
              Reintentar
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITAlert>
    );
  }

  if (!data) return null;

  const { summary, charges, payments } = data;
  const owed = summary.balance > 0;
  const credit = summary.balance < 0;
  const balanceLabel = owed ? "Saldo pendiente" : credit ? "Saldo a favor" : "Al día";

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" gap={2}>
        <ITText as="p" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Estado de cuenta
        </ITText>
        <ITButton size="sm" variant="outlined" icon={<FaSync />} onClick={() => void load()}>
          Actualizar
        </ITButton>
      </ITFlex>

      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} sm={6} xl={3}>
          <StatCard
            label={balanceLabel}
            value={money(Math.abs(summary.balance))}
            icon={<FaWallet />}
            color={owed ? "bg-amber-50 dark:bg-amber-950/20" : "bg-emerald-50 dark:bg-emerald-950/20"}
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          <StatCard label="Cargos" value={money(summary.totalCharges)} icon={<FaReceipt />} color="bg-sky-50 dark:bg-sky-950/20" />
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          <StatCard label="Pagado" value={money(summary.totalPaid)} icon={<FaMoneyBillWave />} color="bg-emerald-50 dark:bg-emerald-950/20" />
        </ITGrid>
        <ITGrid item xs={12} sm={6} xl={3}>
          <StatCard label="Saldo a favor" value={money(summary.credit)} icon={<FaWallet />} color="bg-violet-50 dark:bg-violet-950/20" />
        </ITGrid>
      </ITGrid>

      <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="p-5!">
        <ITFlex align="center" justify="between" gap={2} className="mb-2">
          <ITText as="h3" className="text-sm font-black text-slate-900 dark:text-white">
            Cargos <ITText as="span" className="text-xs font-bold text-slate-400">({charges.length})</ITText>
          </ITText>
        </ITFlex>
        {charges.length === 0 ? (
          <ITEmptyState icon={<FaReceipt />} title="Sin cargos" description="Este residente no tiene cargos registrados." className="py-8" />
        ) : (
          charges.map((charge) => <ChargeLine key={charge.id} charge={charge} />)
        )}
      </ITCard>

      <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="p-5!">
        <ITFlex align="center" justify="between" gap={2} className="mb-2">
          <ITText as="h3" className="text-sm font-black text-slate-900 dark:text-white">
            Pagos <ITText as="span" className="text-xs font-bold text-slate-400">({payments.length})</ITText>
          </ITText>
        </ITFlex>
        {payments.length === 0 ? (
          <ITEmptyState icon={<FaMoneyBillWave />} title="Sin pagos" description="Este residente no tiene pagos registrados." className="py-8" />
        ) : (
          payments.map((payment) => (
            <PaymentLine
              key={payment.id}
              payment={payment}
              busy={receiptId === payment.id}
              onReceipt={(item) => void downloadReceipt(item)}
            />
          ))
        )}
      </ITCard>
    </ITFlex>
  );
};
