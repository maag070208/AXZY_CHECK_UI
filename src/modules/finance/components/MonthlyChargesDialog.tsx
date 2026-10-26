import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITText,
} from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { generateMonthlyCharges } from "../services/finance.service";
import { LottieLoader } from "@app/core/components/LottieLoader";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const MonthlyChargesDialog = ({ isOpen, onClose, onSaved }: Props) => {
  const dispatch = useDispatch();
  const [period, setPeriod] = useState(dayjs().format("YYYY-MM"));
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState<any>(dayjs().add(10, "day").toDate());
  const [concept, setConcept] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPeriod(dayjs().format("YYYY-MM"));
    setAmount(undefined);
    setDueDate(dayjs().add(10, "day").toDate());
    setConcept("");
    setError(null);
  }, [isOpen]);

  const submit = async () => {
    setError(null);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      setError("El periodo debe tener el formato AAAA-MM.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Escribe el monto de la cuota.");
      return;
    }

    setSaving(true);
    try {
      const result = await generateMonthlyCharges({
        period,
        amount,
        dueDate: dayjs(dueDate).format("YYYY-MM-DD"),
        concept: concept.trim() || undefined,
      });
      dispatch(
        showToast({
          message: `${result.created} cuota(s) creada(s); ${result.skipped} propiedad(es) omitida(s).`,
          type: "success",
        }),
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron generar las cuotas.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Generar cuotas del mes" className="w-[620px] max-w-[95vw]">
      <ITFlex direction="column" gap={3} className="relative p-2">
        <ITText as="p" className="text-xs text-slate-500">
          Se genera una cuota por cada propiedad activa con residente titular. Las propiedades que ya
          tienen cuota en ese periodo se omiten.
        </ITText>

        {error && <ITAlert variant="error" title="Revisa los datos">{error}</ITAlert>}

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="period"
              label="Periodo"
              placeholder="AAAA-MM"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              maxLength={7}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInputNumber
              name="amount"
              label="Monto por propiedad"
              prefix="$"
              value={amount}
              onChange={(value) => setAmount(value)}
              min={0.01}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITDatePicker
              name="dueDate"
              label="Vence"
              value={dueDate}
              onChange={(event: any) => setDueDate(event.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="concept"
              label="Concepto (opcional)"
              placeholder={`Cuota mensual ${period}`}
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              maxLength={160}
            />
          </ITGrid>
        </ITGrid>

        <ITFlex justify="end" gap={2}>
          <ITButton label="Cancelar" variant="outlined" onClick={onClose} disabled={saving} />
          <ITButton label={saving ? "Generando..." : "Generar cuotas"} onClick={submit} disabled={saving} />
        </ITFlex>

        {saving && (
          <ITFlex
            align="center"
            justify="center"
            direction="column"
            className="absolute inset-0 z-20 rounded-2xl bg-white/95 p-4 dark:bg-slate-900/95"
          >
            <LottieLoader
              label="Generando cuotas…"
              hint="Estamos creando una cuota por propiedad. Esto puede tardar unos segundos."
              size={148}
            />
          </ITFlex>
        )}
      </ITFlex>
    </ITDialog>
  );
};
