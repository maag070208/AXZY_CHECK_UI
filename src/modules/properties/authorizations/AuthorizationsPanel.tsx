import { ITButton, ITInput, ITLoader } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { PersonLite, searchPersons } from "@app/modules/persons/persons.service";
import { Authorization, createAuthorization, DAY_LABELS, listAuthorizations, revokeAuthorization } from "./authorizations.service";

interface Props {
  propertyId: number;
}

const SCOPE_LABEL: Record<Authorization["scope"], string> = { PEDESTRIAN: "Peatón", VEHICLE: "Vehículo", BOTH: "Peatón y vehículo" };
const today = () => new Date().toISOString().slice(0, 10);

/** Personas autorizadas a entrar sin ser residentes, con horario y revocación (A2, 03 §6). */
export const AuthorizationsPanel = ({ propertyId }: Props) => {
  const [rows, setRows] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonLite[]>([]);
  const [person, setPerson] = useState<PersonLite | null>(null);
  const [scope, setScope] = useState<Authorization["scope"]>("PEDESTRIAN");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [validFrom, setValidFrom] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res: any = await listAuthorizations(propertyId);
    setRows(res.data ?? []);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) return setResults([]);
    const res: any = await searchPersons(q.trim());
    setResults(res.data ?? []);
  };

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const save = async () => {
    setError(null);
    if (!person) return setError("Elige a la persona");
    if (days.length === 0) return setError("Elige al menos un día");
    const res: any = await createAuthorization(propertyId, { personId: person.id, scope, days, startTime, endTime, validFrom, validUntil: validUntil || null });
    if (res.success === false) return setError(res.messages?.[0] ?? "No se pudo autorizar");
    setPerson(null);
    setQuery("");
    void load();
  };

  const revoke = async (id: number) => {
    await revokeAuthorization(id);
    void load();
  };

  if (loading) return <div className="flex justify-center p-6"><ITLoader size="sm" /></div>;

  return (
    <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
      <h2 className="text-lg font-bold text-slate-800">Personas autorizadas</h2>

      <ul className="divide-y divide-slate-100 text-sm">
        {rows.map((a) => (
          <li key={a.id} className="py-3 flex items-center justify-between gap-4">
            <span>
              <strong>{a.person.firstName} {a.person.lastName ?? ""}</strong> · {SCOPE_LABEL[a.scope]} · {a.days.split(",").map((d) => DAY_LABELS[Number(d)]).join(" ")} {a.startTime}–{a.endTime}
              {a.revokedAt ? <em className="ml-2 text-red-600">Revocada</em> : null}
            </span>
            {!a.revokedAt && <ITButton variant="ghost" size="sm" onClick={() => void revoke(a.id)}>Revocar</ITButton>}
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-slate-400">Nadie autorizado</li>}
      </ul>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <ITInput name="authPerson" label="Buscar persona" value={query} onChange={(e) => void search(e.target.value)} />
        {person && <p className="text-sm text-emerald-700">Seleccionada: {person.firstName} {person.lastName ?? ""}</p>}
        {!person && results.map((p) => (
          <ITButton key={p.id} variant="ghost" onClick={() => setPerson(p)} className="block w-full text-left">
            {p.firstName} {p.lastName ?? ""}
          </ITButton>
        ))}

        <label className="text-sm text-slate-600">Alcance
          <select name="scope" className="block w-full border rounded-lg p-2" value={scope} onChange={(e) => setScope(e.target.value as Authorization["scope"])}>
            <option value="PEDESTRIAN">Peatón</option>
            <option value="VEHICLE">Vehículo</option>
            <option value="BOTH">Peatón y vehículo</option>
          </select>
        </label>

        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="text-slate-600 mb-1">Días</legend>
          {DAY_LABELS.map((label, d) => (
            <label key={label} className="flex items-center gap-1">
              <input type="checkbox" checked={days.includes(d)} onChange={() => toggleDay(d)} /> {label}
            </label>
          ))}
        </fieldset>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="text-sm text-slate-600">Desde <input type="time" name="startTime" className="block w-full border rounded-lg p-2" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
          <label className="text-sm text-slate-600">Hasta <input type="time" name="endTime" className="block w-full border rounded-lg p-2" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label>
          <label className="text-sm text-slate-600">Vigente desde <input type="date" name="validFrom" className="block w-full border rounded-lg p-2" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} /></label>
          <label className="text-sm text-slate-600">Hasta (opcional) <input type="date" name="validUntil" className="block w-full border rounded-lg p-2" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></label>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <ITButton onClick={() => void save()} disabled={!person}>Autorizar acceso</ITButton>
      </div>
    </section>
  );
};
