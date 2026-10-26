import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { createCharge, ChargeCategory } from "../services/finance.service";

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  properties: OptionProperty[];
  residents: OptionResident[];
}

const CATEGORY_OPTIONS = [
  { value: "CUOTA", label: "Cuota mensual" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "EXTRA", label: "Extra" },
];

export const ChargeFormDialog = ({ isOpen, onClose, onSaved, properties, residents }: Props) => {
  const dispatch = useDispatch();
  const [propertyId, setPropertyId] = useState("");
  const [residentId, setResidentId] = useState("");
  const [category, setCategory] = useState<ChargeCategory>("CUOTA");
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState<any>(dayjs().add(10, "day").toDate());
  const [period, setPeriod] = useState(dayjs().format("YYYY-MM"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPropertyId("");
    setResidentId("");
    setCategory("CUOTA");
    setConcept("");
    setAmount(undefined);
    setDueDate(dayjs().add(10, "day").toDate());
    setPeriod(dayjs().format("YYYY-MM"));
    setNotes("");
    setError(null);
  }, [isOpen]);

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

  const changeCategory = (value: ChargeCategory) => {
    setCategory(value);
    if (value === "CUOTA") {
      setPeriod((current) => current || dayjs().format("YYYY-MM"));
    }
  };

  const submit = async () => {
    setError(null);
    if (!propertyId) {
      setError("Selecciona la propiedad.");
      return;
    }
    const finalConcept = concept.trim() || (category === "CUOTA" ? `Cuota mensual ${period}` : "");
    if (finalConcept.length < 3) {
      setError("El concepto debe tener al menos 3 caracteres.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Escribe un monto mayor a 0.");
      return;
    }
    if (!dueDate) {
      setError("Selecciona la fecha de vencimiento.");
      return;
    }
    if (category === "CUOTA" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      setError("El periodo de la cuota debe tener el formato AAAA-MM.");
      return;
    }

    setSaving(true);
    try {
      const created = await createCharge({
        propertyId: Number(propertyId),
        residentId: residentId ? Number(residentId) : undefined,
        concept: finalConcept,
        category,
        amount,
        dueDate: dayjs(dueDate).format("YYYY-MM-DD"),
        period: category === "CUOTA" ? period : null,
        notes: notes.trim() || null,
      });
      dispatch(
        showToast({
          message: `Cargo ${created.concept} registrado por ${created.property?.identifier ?? "la propiedad"}.`,
          type: "success",
        }),
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el cargo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Nuevo cargo" className="w-[760px] max-w-[95vw]">
      <ITFlex direction="column" gap={3} className="p-2">
        <ITText as="p" className="text-xs text-slate-500">
          El cargo se asigna al residente titular de la propiedad. Si la propiedad tiene varios residentes, elige a quién corresponde.
        </ITText>

        {error && <ITAlert variant="error" title="Revisa el cargo">{error}</ITAlert>}

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="propertyId"
              label="Propiedad"
              placeholder="Selecciona una propiedad"
              options={propertyOptions}
              value={propertyId}
              onChange={(event) => {
                setPropertyId(event.target.value);
                setResidentId("");
              }}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="residentId"
              label="Residente"
              placeholder={propertyId ? "Titular automático" : "Primero elige la propiedad"}
              options={residentOptions}
              value={residentId}
              onChange={(event) => setResidentId(event.target.value)}
              disabled={!propertyId}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="category"
              label="Tipo de cargo"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(event) => changeCategory(event.target.value as ChargeCategory)}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInputNumber
              name="amount"
              label="Monto"
              prefix="$"
              value={amount}
              onChange={(value) => setAmount(value)}
              min={0.01}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="concept"
              label="Concepto"
              placeholder={category === "CUOTA" ? "Cuota mensual" : "Ej. Reparación de portón"}
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              maxLength={160}
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
          {category === "CUOTA" && (
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
          )}
          <ITGrid item xs={12}>
            <ITTextarea
              name="notes"
              label="Notas (opcional)"
              rows={3}
              value={notes}
              onChange={(value) => setNotes(value)}
              maxLength={1000}
              placeholder="Detalle del cargo, referencia o acuerdo con el residente."
            />
          </ITGrid>
        </ITGrid>

        <ITFlex justify="end" gap={2}>
          <ITButton label="Cancelar" variant="outlined" onClick={onClose} disabled={saving} />
          <ITButton label={saving ? "Guardando..." : "Registrar cargo"} onClick={submit} disabled={saving} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
