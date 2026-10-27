import {
  ITBadget,
  ITButton,
  ITCard,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaAddressBook, FaEnvelope, FaEye, FaHome, FaPhone, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { createPerson, PersonLite, searchPersons } from "../persons.service";

const initials = (person: PersonLite) =>
  `${(person.firstName || "?").charAt(0)}${(person.lastName || "").charAt(0) || ""}`.toUpperCase();

export const PersonsPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<PersonLite[]>([]);
  const [searching, setSearching] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [duplicates, setDuplicates] = useState<PersonLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearching(true);
    const t = setTimeout(() => {
      searchPersons(q.trim())
        .then((res) => setRows(res.data ?? []))
        .catch(() => setRows([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const closeCreate = () => {
    setCreating(false);
    setDuplicates([]);
    setError(null);
    setForm({ firstName: "", lastName: "", phone: "", email: "" });
  };

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
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      title="Personas"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Personas" }]}
      description="Directorio general del residencial. Los residentes con acceso a la app se administran en Residentes."
      icon={<FaAddressBook size={20} />}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITButton variant="outlined" color="secondary" size="md" icon={<FaHome />} onClick={() => navigate("/residents")}>
            Residentes con app
          </ITButton>
          <ITButton color="primary" size="md" icon={<FaPlus />} onClick={() => setCreating(true)}>
            Nueva persona
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={4} className="w-full pb-10 pt-5">
        <ITCard className="rounded-3xl" contentClassName="p-4!">
          <ITGrid container columns={12} spacing={3} className="items-end">
            <ITGrid item xs={12} md={9}>
              <ITFlex direction="column" gap={1}>
                <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Buscar por nombre o teléfono
                </ITText>
                <ITFlex align="center" gap={1}>
                  <ITInput
                    name="q"
                    placeholder="Ej. Ana Pérez o 6641234567"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    iconLeft={<FaSearch />}
                    size="md"
                  />
                  {q && (
                    <ITButton
                      variant="icon-only"
                      color="secondary"
                      size="sm"
                      icon={<FaTimes size={12} />}
                      onClick={() => setQ("")}
                      ariaLabel="Limpiar búsqueda"
                      title="Limpiar búsqueda"
                    />
                  )}
                </ITFlex>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITFlex align="center" justify="end" className="h-full">
                <ITBadget color="secondary" variant="filled" size="sm">
                  {rows.length} {rows.length === 1 ? "resultado" : "resultados"}
                </ITBadget>
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITCard>

        <ITCard className="rounded-3xl" contentClassName="p-4!">
          <ITGrid container columns={12} spacing={3} className="mb-2 px-2">
            <ITGrid item xs={5}>
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Persona</ITText>
            </ITGrid>
            <ITGrid item xs={3} className="hidden sm:block">
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Teléfono</ITText>
            </ITGrid>
            <ITGrid item xs={3} className="hidden sm:block">
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Correo</ITText>
            </ITGrid>
            <ITGrid item xs={12} sm={1}>
              <ITText as="p" className="text-right text-[9px] font-black uppercase tracking-widest text-slate-400">Acción</ITText>
            </ITGrid>
          </ITGrid>

          {searching ? (
            <ITFlex justify="center" className="py-12">
              <ITLoader />
            </ITFlex>
          ) : rows.length === 0 ? (
            <ITEmptyState
              icon={<FaAddressBook />}
              title={q.trim() ? "Sin resultados" : "Sin personas registradas"}
              description={q.trim() ? "Prueba con otro nombre o teléfono." : "Crea la primera persona del directorio."}
              className="py-10"
            />
          ) : (
            <ITFlex direction="column" gap={1}>
              {rows.map((person) => (
                <ITFlex
                  key={person.id}
                  align="center"
                  className="rounded-xl bg-slate-50/60 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-900/40"
                >
                  <ITGrid container columns={12} spacing={2} className="w-full items-center">
                    <ITGrid item xs={12} sm={5}>
                      <ITFlex align="center" gap={2}>
                        <ITFlex
                          align="center"
                          justify="center"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-black text-white"
                        >
                          {initials(person)}
                        </ITFlex>
                        <ITText as="p" className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                          {person.firstName} {person.lastName ?? ""}
                        </ITText>
                      </ITFlex>
                    </ITGrid>
                    <ITGrid item xs={6} sm={3}>
                      <ITText as="p" className="flex items-center gap-1 text-[11px] text-slate-500">
                        <FaPhone size={9} /> {person.phone || "Sin teléfono"}
                      </ITText>
                    </ITGrid>
                    <ITGrid item xs={6} sm={3}>
                      <ITText as="p" className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                        <FaEnvelope size={9} /> {person.email || "Sin correo"}
                      </ITText>
                    </ITGrid>
                    <ITGrid item xs={12} sm={1}>
                      <ITFlex justify="end">
                        <ITButton
                          onClick={() => navigate(`/persons/${person.id}`)}
                          size="md"
                          variant="icon-only"
                          color="primary"
                          icon={<FaEye />}
                          ariaLabel="Ver ficha"
                          title="Ver ficha"
                        />
                      </ITFlex>
                    </ITGrid>
                  </ITGrid>
                </ITFlex>
              ))}
            </ITFlex>
          )}
        </ITCard>
      </ITFlex>

      <ITDialog isOpen={creating} onClose={closeCreate} title="Nueva persona" className="w-[560px] max-w-[95vw]">
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-xs text-slate-500">
            Una persona puede ser titular, inquilino, residente, visita o contacto. No necesariamente tendrá acceso a la app.
          </ITText>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} sm={6}>
              <ITInput name="firstName" label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </ITGrid>
            <ITGrid item xs={12} sm={6}>
              <ITInput name="lastName" label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </ITGrid>
            <ITGrid item xs={12} sm={6}>
              <ITInput name="phone" label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </ITGrid>
            <ITGrid item xs={12} sm={6}>
              <ITInput name="email" label="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </ITGrid>
          </ITGrid>

          {duplicates.length > 0 && (
            <ITCard className="rounded-2xl border-0! bg-amber-50! shadow-none!" contentClassName="space-y-2 p-4!">
              <ITText as="p" className="text-xs font-bold text-amber-800">
                Ya existe alguien con estos datos:
              </ITText>
              {duplicates.map((d) => (
                <ITText as="p" key={d.id} className="text-xs text-amber-700">
                  • {d.firstName} {d.lastName ?? ""} {d.phone ?? ""}
                </ITText>
              ))}
              <ITButton variant="outlined" color="warning" size="sm" onClick={() => void save(true)}>
                Crear de todos modos
              </ITButton>
            </ITCard>
          )}

          {error && <ITText as="p" className="text-sm text-rose-600">{error}</ITText>}

          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={closeCreate}>
              Cancelar
            </ITButton>
            <ITButton color="primary" onClick={() => void save(false)} disabled={!form.firstName.trim()}>
              Guardar
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};
