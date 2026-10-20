import { ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPerson, PersonLite, searchPersons } from "../persons.service";

/** Personas (A2): búsqueda y alta con control de duplicados. */
export const PersonsPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PersonLite[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [duplicates, setDuplicates] = useState<PersonLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      searchPersons(q.trim())
        .then((res) => setRows(res.data ?? []))
        .catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const save = async (confirmNewPerson = false) => {
    setError(null);
    const res: any = await createPerson({
      firstName: form.firstName,
      lastName: form.lastName || null,
      phone: form.phone || null,
      email: form.email || null,
      confirmNewPerson,
    });
    if (res.success === false && res.code === "DUPLICATE_PERSON") {
      setDuplicates(res.candidates ?? []);
      return;
    }
    if (res.success === false) return setError(res.messages?.[0] ?? "No se pudo guardar");
    setCreating(false);
    setDuplicates([]);
    navigate(`/persons/${res.data.id}`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Personas</h1>
        <ITButton onClick={() => setCreating(true)}>Nueva persona</ITButton>
      </div>

      <ITInput name="q" label="Buscar por nombre o teléfono" value={q} onChange={(e) => setQ(e.target.value)} />

      <ul className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-100">
        {rows.map((p) => (
          <li key={p.id}>
            <button className="w-full text-left px-6 py-3 hover:bg-slate-50" onClick={() => navigate(`/persons/${p.id}`)}>
              <span className="font-semibold text-slate-800">{p.firstName} {p.lastName ?? ""}</span>
              <span className="ml-3 text-sm text-slate-500">{p.phone ?? ""}</span>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="px-6 py-4 text-slate-400">Sin resultados</li>}
      </ul>

      <ITDialog isOpen={creating} onClose={() => { setCreating(false); setDuplicates([]); setError(null); }} title="Nueva persona" className="w-[560px] max-w-[95vw]">
        <div className="space-y-3 p-2">
          <ITInput name="firstName" label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <ITInput name="lastName" label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <ITInput name="phone" label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <ITInput name="email" label="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          {duplicates.length > 0 && (
            <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 space-y-2">
              <p>Ya existe alguien con estos datos:</p>
              <ul className="list-disc pl-5">
                {duplicates.map((d) => <li key={d.id}>{d.firstName} {d.lastName ?? ""} {d.phone ?? ""}</li>)}
              </ul>
              <ITButton variant="outlined" onClick={() => void save(true)}>Crear de todos modos</ITButton>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <ITButton variant="outlined" onClick={() => setCreating(false)}>Cancelar</ITButton>
            <ITButton onClick={() => void save(false)} disabled={!form.firstName.trim()}>Guardar</ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};
