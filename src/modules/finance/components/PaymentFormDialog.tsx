import {
  ITAlert,
  ITButton,
  ITCheckbox,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { PaymentMethod, PaymentRow, registerPayment } from "../services/finance.service";

interface OptionProperty {
  id: number;
  identifier: string;
  name: string;
}

interface OptionResident {
  id: number;
  name: string;
  lastName?: string | null;
  propertyId?: number;
}

export interface PaymentPreset {
  propertyId: number;
  residentId?: number | null;
  amount?: number;
  chargeId?: number;
  concept?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  properties: OptionProperty[];
  residents: OptionResident[];
  preset?: PaymentPreset | null;
}

const METHOD_OPTIONS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "AJUSTE", label: "Ajuste" },
];

export const PaymentFormDialog = ({ isOpen, onClose, onSaved, properties, residents, preset }: Props) => {
  const dispatch = useDispatch();
  const [propertyId, setPropertyId] = useState("");
  const [residentId, setResidentId] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [method, setMethod] = useState<PaymentMethod>("EFECTIVO");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState<any>(new Date());
  const [notes, setNotes] = useState("");
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPropertyId(preset ? String(preset.propertyId) : "");
    setResidentId(preset?.residentId ? String(preset.residentId) : "");
    setAmount(preset?.amount);
    setMethod("EFECTIVO");
    setReference("");
    setPaidAt(new Date());
    setNotes(preset?.concept ? `Pago de: ${preset.concept}` : "");
    setAllowOverpayment(false);
    setError(null);
  }, [isOpen, preset]);

  const propertyOptions = useMemo(
    () => properties.map((property) => ({
      value: String(property.id),
      label: `${property.identifier} · ${property.name}`,
    })),
    [properties],
  );

  const residentOptions = useMemo(
    () =>
      residents
        .filter((resident) => String(resident.propertyId ?? "") === propertyId)
        .map((resident) => ({
          value: String(resident.id),
          label: `${resident.name} ${resident.lastName ?? ""}`.trim(),
        })),
    [propertyId, residents],
  );

  const submit = async () => {
    setError(null);
    if (!propertyId) {
      setError("Selecciona la propiedad.");
      return;
    }
    if (!residentId) {
      setError("Selecciona el residente que realiza el pago.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Escribe un monto mayor a 0.");
      return;
    }
    if (method === "AJUSTE" && notes.trim().length < 3) {
      setError("El ajuste requiere una nota que explique el movimiento.");
      return;
    }

    setSaving(true);
    try {
      const created: PaymentRow = await registerPayment({
        propertyId: Number(propertyId),
        residentId: Number(residentId),
        amount,
        method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        paidAt: dayjs(paidAt).format("YYYY-MM-DD"),
        allowOverpayment,
        ...(preset?.chargeId ? { chargeIds: [preset.chargeId] } : {}),
      });
      dispatch(
        showToast({
          message: `Pago de ${amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} registrado.`,
          type: "success",
        }),
      );
      onSaved();
      onClose();
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Registrar pago" className="w-[760px] max-w-[95vw]">
      <ITFlex direction="column" gap={3} className="p-2">
        <ITText as="p" className="text-xs text-slate-500">
          {preset
            ? "El pago se aplicará al cargo seleccionado. Revisa el monto y el método antes de guardar."
            : "El pago se aplica a los cargos pendientes del residente, del más antiguo al más reciente. Si sobra dinero, puedes registrarlo como saldo a favor."}
        </ITText>

        {error && <ITAlert variant="error" title="Revisa el pago">{error}</ITAlert>}

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSearchSelect
              name="propertyId"
              label="Propiedad"
              placeholder="Busca una propiedad…"
              options={propertyOptions}
              value={propertyId}
              onChange={(value) => {
                setPropertyId(String(value));
                setResidentId("");
              }}
              disabled={!!preset}
              clearable={false}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSearchSelect
              name="residentId"
              label="Residente"
              placeholder={propertyId ? "Busca al residente…" : "Primero elige la propiedad"}
              options={residentOptions}
              value={residentId}
              onChange={(value) => setResidentId(String(value))}
              disabled={!!preset || !propertyId}
              clearable={false}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInputNumber
              name="amount"
              label="Monto recibido"
              prefix="$"
              value={amount}
              onChange={(value) => setAmount(value)}
              min={0.01}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSearchSelect
              name="method"
              label="Método"
              options={METHOD_OPTIONS}
              value={method}
              onChange={(value) => setMethod(String(value) as PaymentMethod)}
              clearable={false}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="reference"
              label="Referencia (opcional)"
              placeholder="Folio, transferencia o nota"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              maxLength={120}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITDatePicker
              name="paidAt"
              label="Fecha del pago"
              value={paidAt}
              onChange={(event: any) => setPaidAt(event.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITTextarea
              name="notes"
              label={method === "AJUSTE" ? "Nota del ajuste" : "Notas (opcional)"}
              rows={3}
              value={notes}
              onChange={(value) => setNotes(value)}
              maxLength={1000}
              placeholder={method === "AJUSTE" ? "Explica por qué se registra este ajuste." : "Detalle del pago."}
            />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITCheckbox
              checked={allowOverpayment}
              onChange={setAllowOverpayment}
              label={
                <ITText as="span" className="text-xs font-semibold text-slate-600">
                  Registrar el excedente como saldo a favor
                </ITText>
              }
            />
          </ITGrid>
        </ITGrid>

        <ITFlex justify="end" gap={2}>
          <ITButton label="Cancelar" variant="outlined" onClick={onClose} disabled={saving} />
          <ITButton label={saving ? "Guardando..." : "Registrar pago"} onClick={submit} disabled={saving} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
