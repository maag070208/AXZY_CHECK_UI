import {
  ITAlert,
  ITButton,
  ITCard,
  ITCheckbox,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  AccessEventRow,
  AccessException,
  createAccessException,
  getAccessEvents,
  DelinquencyRule,
  getAccessExceptions,
  getDelinquencyRule,
  revokeAccessException,
  updateDelinquencyRule,
} from "../services/access.service";

interface OptionProperty {
  id: number;
  identifier: string;
  name: string;
}

export const DelinquencyRuleCard = ({ properties }: { properties: OptionProperty[] }) => {
  const dispatch = useDispatch();
  const [rule, setRule] = useState<DelinquencyRule | null>(null);
  const [exceptions, setExceptions] = useState<AccessException[]>([]);
  const [deniedEvents, setDeniedEvents] = useState<AccessEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [reason, setReason] = useState("");
  const [validUntil, setValidUntil] = useState<any>(dayjs().add(7, "day").toDate());
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [nextRule, nextExceptions, events] = await Promise.all([
        getDelinquencyRule(),
        getAccessExceptions(),
        getAccessEvents({ page: 1, pageSize: 5, decision: "DENIED" }),
      ]);
      setRule(nextRule);
      setExceptions(nextExceptions);
      setDeniedEvents(events.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la regla de morosos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!rule) return;
    setSaving(true);
    try {
      setRule(
        await updateDelinquencyRule({
          enabled: rule.enabled,
          minOverdueDays: rule.minOverdueDays,
          blockVisitors: rule.blockVisitors,
          active: rule.active,
        }),
      );
      dispatch(showToast({ message: "Regla de morosos guardada", type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err instanceof Error ? err.message : "No se pudo guardar", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const createException = async () => {
    if (!propertyId || reason.trim().length < 3) {
      dispatch(showToast({ message: "Elige una propiedad y escribe el motivo", type: "warning" }));
      return;
    }
    setCreating(true);
    try {
      await createAccessException({
        propertyId: Number(propertyId),
        reason: reason.trim(),
        validUntil: dayjs(validUntil).format("YYYY-MM-DD"),
      });
      setReason("");
      setPropertyId("");
      await load();
      dispatch(showToast({ message: "Excepción autorizada", type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err instanceof Error ? err.message : "No se pudo autorizar", type: "error" }));
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: number) => {
    try {
      await revokeAccessException(id);
      await load();
      dispatch(showToast({ message: "Excepción revocada", type: "success" }));
    } catch (err) {
      dispatch(showToast({ message: err instanceof Error ? err.message : "No se pudo revocar", type: "error" }));
    }
  };

  const propertyOptions = properties.map((property) => ({
    value: String(property.id),
    label: `${property.identifier} · ${property.name}`,
  }));

  return (
    <ITCard title="Control de morosos" className="rounded-3xl border border-slate-200 shadow-sm" contentClassName="p-5!">
      {error && <ITAlert variant="error" title="No se pudo cargar la regla">{error}</ITAlert>}

      {loading || !rule ? (
        <ITText as="p" className="py-4 text-center text-xs text-slate-400">Cargando regla de morosos…</ITText>
      ) : (
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-xs leading-5 text-slate-500">
            Si una propiedad tiene cargos vencidos por más de los días configurados, se bloquea el acceso
            de toda la propiedad y de sus visitas. Solo administración puede autorizar una excepción.
          </ITText>

          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInputNumber
                name="minOverdueDays"
                label="Días de atraso"
                value={rule.minOverdueDays}
                onChange={(value) => setRule({ ...rule, minOverdueDays: value ?? 0 })}
                min={0}
                max={365}
                decimals={0}
              />
            </ITGrid>
            <ITGrid item xs={12} md={8}>
              <ITFlex align="center" gap={3} wrap="wrap" className="h-full pt-5">
                <ITCheckbox label="Bloqueo activo" checked={rule.enabled} onChange={(checked) => setRule({ ...rule, enabled: checked })} />
                <ITCheckbox label="Bloquear visitas" checked={rule.blockVisitors} onChange={(checked) => setRule({ ...rule, blockVisitors: checked })} />
                <ITCheckbox label="Regla vigente" checked={rule.active} onChange={(checked) => setRule({ ...rule, active: checked })} />
              </ITFlex>
            </ITGrid>
          </ITGrid>

          <ITFlex justify="end">
            <ITButton label={saving ? "Guardando…" : "Guardar regla"} onClick={() => void save()} disabled={saving} />
          </ITFlex>
        </ITFlex>
      )}

      <ITFlex direction="column" gap={3} className="mt-6 border-t border-slate-100 pt-5">
        <ITText as="p" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Excepción temporal
        </ITText>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={5}>
            <ITSearchSelect
              name="exceptionProperty"
              label="Propiedad"
              placeholder="Busca una propiedad…"
              options={propertyOptions}
              value={propertyId}
              onChange={(value) => setPropertyId(String(value))}
              clearable={false}
            />
          </ITGrid>
          <ITGrid item xs={12} md={5}>
            <ITInput
              name="exceptionReason"
              label="Motivo"
              placeholder="Ej. Convenio de pago autorizado"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
            />
          </ITGrid>
          <ITGrid item xs={12} md={2}>
            <ITDatePicker name="exceptionUntil" label="Vence" value={validUntil} onChange={(event: any) => setValidUntil(event.target.value)} />
          </ITGrid>
        </ITGrid>
        <ITFlex justify="end">
          <ITButton label={creating ? "Autorizando…" : "Autorizar excepción"} variant="outlined" onClick={() => void createException()} disabled={creating} />
        </ITFlex>

        {exceptions.length > 0 && (
          <ITFlex direction="column" gap={2}>
            {exceptions.map((exception) => (
              <ITFlex key={exception.id} align="center" justify="between" gap={2} className="rounded-xl bg-slate-50 px-3 py-2">
                <ITFlex direction="column" className="min-w-0">
                  <ITText as="p" className="truncate text-xs font-bold text-slate-700">
                    {exception.property?.identifier ?? `Propiedad ${exception.propertyId}`} · hasta {dayjs(exception.validUntil).format("DD/MM/YYYY")}
                  </ITText>
                  <ITText as="p" className="truncate text-[10px] text-slate-500">{exception.reason}</ITText>
                </ITFlex>
                <ITButton label="Revocar" size="sm" variant="text" color="danger" onClick={() => void revoke(exception.id)} />
              </ITFlex>
            ))}
          </ITFlex>
        )}

        {deniedEvents.length > 0 && (
          <ITFlex direction="column" gap={2} className="mt-2 border-t border-slate-100 pt-4">
            <ITText as="p" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Últimos intentos denegados
            </ITText>
            {deniedEvents.map((event) => (
              <ITFlex key={event.id} align="center" justify="between" gap={2} className="rounded-xl bg-rose-50/70 px-3 py-2">
                <ITFlex direction="column" className="min-w-0">
                  <ITText as="p" className="truncate text-xs font-bold text-slate-700">
                    {event.property?.identifier ?? `Propiedad ${event.propertyId}`} · {dayjs(event.occurredAt).format("DD/MM/YYYY HH:mm")}
                  </ITText>
                  <ITText as="p" className="truncate text-[10px] text-rose-600">{event.reason ?? "Acceso denegado"}</ITText>
                </ITFlex>
                <ITText as="span" className="text-[10px] font-semibold text-slate-400">{event.method}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </ITFlex>
    </ITCard>
  );
};
