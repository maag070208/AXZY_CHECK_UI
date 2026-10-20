import { ITButton, ITDatePicker, ITInput, ITLoader, ITSearchSelect, ITTimePicker } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { PersonLite, searchPersons } from "@app/modules/persons/persons.service";
import QRCode from "qrcode";
import { Authorization, createAuthorization, DAY_LABELS, issuePass, listAuthorizations, revokeAuthorization } from "./authorizations.service";

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

  const [passFor, setPassFor] = useState<{ id: number; dataUrl: string } | null>(null);

  /** El token se muestra una sola vez: emitir de nuevo invalida el pase anterior. */
  const generatePass = async (id: number) => {
    const res: any = await issuePass(id);
    if (res.success === false) return setError(res.messages?.[0] ?? "No se pudo generar el pase");
    setPassFor({ id, dataUrl: await QRCode.toDataURL(res.data.token, { width: 220, margin: 1 }) });
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
            {!a.revokedAt && (
              <div className="flex gap-2">
                <ITButton variant="ghost" size="sm" onClick={() => void generatePass(a.id)}>Generar pase</ITButton>
                <ITButton variant="ghost" size="sm" onClick={() => void revoke(a.id)}>Revocar</ITButton>
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-slate-400">Nadie autorizado</li>}
      </ul>

      {passFor && (
        <div className="rounded-2xl bg-slate-50 p-4 flex items-center gap-4">
          <img src={passFor.dataUrl} alt="Pase QR" width={220} height={220} />
          <p className="text-sm text-slate-600">Pase de acceso. Se muestra una sola vez: si lo generas de nuevo, este deja de funcionar.</p>
          <ITButton variant="outlined" size="sm" onClick={() => setPassFor(null)}>Cerrar</ITButton>
        </div>
      )}

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <ITInput name="authPerson" label="Buscar persona" value={query} onChange={(e) => void search(e.target.value)} />
        {person && <p className="text-sm text-emerald-700">Seleccionada: {person.firstName} {person.lastName ?? ""}</p>}
        {!person && results.map((p) => (
          <ITButton key={p.id} variant="ghost" onClick={() => setPerson(p)}>
            {p.firstName} {p.lastName ?? ""}
          </ITButton>
        ))}

        <label className="text-sm text-slate-600">Alcance
          <ITSearchSelect
            name="scope"
            value={scope}
            onChange={(value) => setScope(String(value) as Authorization["scope"])}
            options={[
              { label: "Peatón", value: "PEDESTRIAN" },
              { label: "Vehículo", value: "VEHICLE" },
              { label: "Peatón y vehículo", value: "BOTH" },
            ]}
            clearable={false}
          />
        </label>

        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="text-slate-600 mb-1">Días</legend>
          {DAY_LABELS.map((label, d) => (
            <ITInput
              key={label}
              name={`day${d}`}
              type="checkbox"
              label={label}
              checked={days.includes(d)}
              onChange={() => toggleDay(d)}
            />
          ))}
        </fieldset>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ITTimePicker name="startTime" label="Desde" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <ITTimePicker name="endTime" label="Hasta" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <ITDatePicker
            name="validFrom"
            label="Vigente desde"
            value={validFrom ? dayjs(validFrom).toDate() : undefined}
            onChange={(e) => setValidFrom(e.target.value ? dayjs(e.target.value as Date).format("YYYY-MM-DD") : "")}
          />
          <ITDatePicker
            name="validUntil"
            label="Hasta (opcional)"
            value={validUntil ? dayjs(validUntil).toDate() : undefined}
            onChange={(e) => setValidUntil(e.target.value ? dayjs(e.target.value as Date).format("YYYY-MM-DD") : "")}
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <ITButton onClick={() => void save()} disabled={!person}>Autorizar acceso</ITButton>
      </div>
    </section>
  );
};
