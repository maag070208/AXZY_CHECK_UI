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
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  COLLECTION_FREQUENCY_OPTIONS,
  CollectionConfigInput,
  CollectionConfigRow,
  CollectionFrequency,
  LATE_FEE_OPTIONS,
  LateFeeType,
  saveCollectionConfig,
  updateCollectionConfig,
} from "../services/collection.service";

interface OptionProperty {
  id: number;
  identifier: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  properties: OptionProperty[];
  config?: CollectionConfigRow | null;
}

export const CollectionConfigDialog = ({ isOpen, onClose, onSaved, properties, config }: Props) => {
  const [propertyId, setPropertyId] = useState("");
  const [concept, setConcept] = useState("Cuota de mantenimiento");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [frequency, setFrequency] = useState<CollectionFrequency>("MONTHLY");
  const [dueDay, setDueDay] = useState<number | undefined>(10);
  const [nextChargeDate, setNextChargeDate] = useState<any>(dayjs().add(1, "month").date(10).toDate());
  const [graceDays, setGraceDays] = useState<number | undefined>(5);
  const [lateFeeType, setLateFeeType] = useState<LateFeeType>("NONE");
  const [lateFeeValue, setLateFeeValue] = useState<number | undefined>(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPropertyId(config ? String(config.propertyId) : "");
    setConcept(config?.concept ?? "Cuota de mantenimiento");
    setAmount(config?.amount);
    setFrequency(config?.frequency ?? "MONTHLY");
    setDueDay(config?.dueDay ?? 10);
    setNextChargeDate(config ? dayjs(config.nextChargeDate).toDate() : dayjs().add(1, "month").date(10).toDate());
    setGraceDays(config?.graceDays ?? 5);
    setLateFeeType(config?.lateFeeType ?? "NONE");
    setLateFeeValue(config?.lateFeeValue ?? 0);
    setActive(config?.active ?? true);
    setError(null);
  }, [config, isOpen]);

  const propertyOptions = useMemo(
    () => properties.map((property) => ({
      value: String(property.id),
      label: `${property.identifier} · ${property.name}`,
    })),
    [properties],
  );

  const submit = async () => {
    setError(null);
    if (!propertyId) {
      setError("Selecciona la propiedad.");
      return;
    }
    if (concept.trim().length < 3) {
      setError("El concepto debe tener al menos 3 caracteres.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Escribe un monto mayor a 0.");
      return;
    }
    if (!dueDay || dueDay < 1 || dueDay > 28) {
      setError("El día de vencimiento debe estar entre 1 y 28.");
      return;
    }
    if (!nextChargeDate) {
      setError("Selecciona el próximo cobro.");
      return;
    }
    if (lateFeeType !== "NONE" && (!lateFeeValue || lateFeeValue <= 0)) {
      setError("El valor del recargo debe ser mayor a 0.");
      return;
    }

    const payload: CollectionConfigInput = {
      propertyId: Number(propertyId),
      concept: concept.trim(),
      amount,
      frequency,
      dueDay,
      nextChargeDate: dayjs(nextChargeDate).format("YYYY-MM-DD"),
      graceDays: graceDays ?? 0,
      lateFeeType,
      lateFeeValue: lateFeeType === "NONE" ? 0 : lateFeeValue ?? 0,
      active,
    };

    setSaving(true);
    try {
      if (config) {
        const { propertyId: _propertyId, ...rest } = payload;
        await updateCollectionConfig(config.id, rest);
      } else {
        await saveCollectionConfig(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={config ? "Editar cobranza" : "Nueva cobranza"} className="w-[820px] max-w-[95vw]">
      <ITFlex direction="column" gap={3} className="p-2">
        <ITText as="p" className="text-xs text-slate-500">
          Define cada cuánto se genera la cuota, cuándo vence y cómo se cobran los recargos por atraso.
        </ITText>

        {error && <ITAlert variant="error" title="Revisa la configuración">{error}</ITAlert>}

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSearchSelect
              name="propertyId"
              label="Propiedad"
              placeholder="Busca una propiedad…"
              options={propertyOptions}
              value={propertyId}
              onChange={(value) => setPropertyId(String(value))}
              disabled={!!config}
              clearable={false}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="concept"
              label="Concepto"
              placeholder="Cuota de mantenimiento"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              maxLength={160}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInputNumber
              name="amount"
              label="Monto de la cuota"
              prefix="$"
              value={amount}
              onChange={(value) => setAmount(value)}
              min={0.01}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="frequency"
              label="Periodicidad"
              options={COLLECTION_FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(value) => setFrequency(String(value) as CollectionFrequency)}
              clearable={false}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInputNumber
              name="dueDay"
              label="Día de vencimiento"
              value={dueDay}
              onChange={(value) => setDueDay(value)}
              min={1}
              max={28}
              decimals={0}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITDatePicker
              name="nextChargeDate"
              label="Próximo cobro"
              value={nextChargeDate}
              onChange={(event: any) => setNextChargeDate(event.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInputNumber
              name="graceDays"
              label="Días de gracia"
              value={graceDays}
              onChange={(value) => setGraceDays(value)}
              min={0}
              max={90}
              decimals={0}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITCheckbox label="Cobranza activa" checked={active} onChange={setActive} />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="lateFeeType"
              label="Recargo por atraso"
              options={LATE_FEE_OPTIONS}
              value={lateFeeType}
              onChange={(value) => setLateFeeType(String(value) as LateFeeType)}
              clearable={false}
            />
          </ITGrid>
          {lateFeeType !== "NONE" && (
            <ITGrid item xs={12} md={4}>
              <ITInputNumber
                name="lateFeeValue"
                label={lateFeeType === "PERCENT" ? "Porcentaje" : "Monto fijo"}
                prefix={lateFeeType === "FIXED" ? "$" : undefined}
                value={lateFeeValue}
                onChange={(value) => setLateFeeValue(value)}
                min={0.01}
                max={lateFeeType === "PERCENT" ? 100 : undefined}
                required
              />
            </ITGrid>
          )}
        </ITGrid>

        <ITFlex justify="end" gap={2}>
          <ITButton label="Cancelar" variant="outlined" onClick={onClose} disabled={saving} />
          <ITButton label={saving ? "Guardando..." : "Guardar configuración"} onClick={submit} disabled={saving} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
