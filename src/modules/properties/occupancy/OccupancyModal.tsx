import { ITButton, ITDialog, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { changeOccupancy, createPerson, getOccupancyStatuses, OccupancyStatus, PersonLite, searchPersons } from "./occupancy.service";

interface Props {
  isOpen: boolean;
  propertyId: number;
  currentCode: string | null;
  onClose: () => void;
  onDone: () => void;
}

const NEEDS_TENANT = ["RENTED"];

/** Cambio de ocupación (T-A1-04). Pide inquilino para Rentada y confirma la baja de residentes si hace falta. */
export const OccupancyModal = ({ isOpen, propertyId, currentCode, onClose, onDone }: Props) => {
  const [statuses, setStatuses] = useState<OccupancyStatus[]>([]);
  const [target, setTarget] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonLite[]>([]);
  const [tenant, setTenant] = useState<PersonLite | null>(null);
  const [notes, setNotes] = useState("");
  const [needsRelease, setNeedsRelease] = useState(false);
  const [releaseConfirmed, setReleaseConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setTarget("");
    setTenant(null);
    setNotes("");
    setNeedsRelease(false);
    setReleaseConfirmed(false);
    getOccupancyStatuses()
      .then((res) => setStatuses(res.data ?? []))
      .catch(() => setStatuses([]));
  }, [isOpen]);

  const current = statuses.find((s) => s.code === currentCode);
  const options = (current?.allowedNext ?? [])
    .map((code) => statuses.find((s) => s.code === code))
    .filter((s): s is OccupancyStatus => Boolean(s))
    .map((s) => ({ value: s.code, label: s.name }));

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) return setResults([]);
    const res = await searchPersons(q.trim());
    setResults(res.data ?? []);
  };

  const createTenantFromQuery = async () => {
    const [firstName, ...rest] = query.trim().split(" ");
    const res: any = await createPerson({ firstName, lastName: rest.join(" ") || null });
    if (res.data) setTenant(res.data);
    else setError(res.messages?.[0] ?? "No se pudo crear la persona");
  };

  const submit = async () => {
    setError(null);
    if (!target) return setError("Elige el nuevo estado");
    if (NEEDS_TENANT.includes(target) && !tenant) return setError("Una propiedad rentada necesita un inquilino");
    setSaving(true);
    try {
      const res: any = await changeOccupancy(propertyId, {
        status: target,
        tenantPersonId: tenant?.id ?? null,
        releaseResidents: releaseConfirmed,
        notes: notes || null,
      });
      if (res.success === false) {
        if (res.code === "OCCUPANCY_HAS_RESIDENTS") {
          setNeedsRelease(true);
          setError("La propiedad tiene residentes activos. Confirma su baja para continuar.");
        } else {
          setError(res.messages?.[0] ?? "No se pudo cambiar la ocupación");
        }
        return;
      }
      onDone();
      onClose();
    } catch (e: any) {
      setError(e?.messages?.[0] ?? "No se pudo cambiar la ocupación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Cambiar ocupación" className="w-[640px] max-w-[95vw]">
      <div className="space-y-4 p-2">
        <p className="text-sm text-slate-500">Estado actual: <strong>{current?.name ?? "—"}</strong></p>

        <ITSelect
          name="target"
          label="Nuevo estado"
          placeholder={options.length ? "Selecciona…" : "Sin cambios disponibles"}
          options={options}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={options.length === 0}
        />

        {(NEEDS_TENANT.includes(target) || target === "OWNER_OCCUPIED") && (
          <div className="space-y-2">
            <ITInput name="personQuery" label={target === "RENTED" ? "Inquilino" : "Persona que habita"} placeholder="Buscar por nombre o teléfono" value={query} onChange={(e) => void search(e.target.value)} />
            {tenant && <p className="text-sm text-emerald-700">Seleccionado: {tenant.firstName} {tenant.lastName ?? ""}</p>}
            {!tenant && results.map((p) => (
              <ITButton key={p.id} variant="ghost" onClick={() => setTenant(p)} className="block w-full text-left">
                {p.firstName} {p.lastName ?? ""} {p.phone ? `· ${p.phone}` : ""}
              </ITButton>
            ))}
            {!tenant && query.trim().length >= 2 && results.length === 0 && (
              <ITButton variant="outlined" onClick={() => void createTenantFromQuery()}>Crear persona “{query.trim()}”</ITButton>
            )}
          </div>
        )}

        <ITInput name="notes" label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        {needsRelease && (
          <label className="flex items-center gap-2 text-sm text-red-700">
            <input type="checkbox" checked={releaseConfirmed} onChange={(e) => setReleaseConfirmed(e.target.checked)} />
            Confirmo la baja de los residentes activos de esta propiedad
          </label>
        )}

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <ITButton variant="outlined" onClick={onClose}>Cancelar</ITButton>
          <ITButton onClick={() => void submit()} disabled={saving || (needsRelease && !releaseConfirmed)}>
            {saving ? "Guardando…" : "Confirmar cambio"}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
