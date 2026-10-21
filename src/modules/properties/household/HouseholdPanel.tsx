import { ITButton, ITFlex, ITInput, ITLoader, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { addHouseholdResident, HouseholdResident, listHousehold, listResidentKinds, moveOutResident, ResidentKindOption, setPrimaryResident } from "./household.service";

interface Props {
  propertyId: number;
  onChanged: () => void;
}

/** Hogar de la propiedad (A2): residentes con su tipo, titular único, alta y mudanza. */
export const HouseholdPanel = ({ propertyId, onChanged }: Props) => {
  const [rows, setRows] = useState<HouseholdResident[]>([]);
  const [kinds, setKinds] = useState<ResidentKindOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", kindCode: "FAMILY" });
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setLoadError(null);
    try {
      const res: any = await listHousehold(propertyId);
      if (res.success === false) {
        setRows([]);
        setLoadError(res.messages?.[0] ?? "No se pudo cargar el hogar");
      } else {
        setRows(res.data ?? []);
      }
    } catch (error: any) {
      setRows([]);
      setLoadError(error?.messages?.[0] ?? "No se pudo cargar el hogar");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load(true);
    listResidentKinds()
      .then((res) => setKinds(res.data ?? []))
      .catch(() => setKinds([]));
  }, [load]);

  const add = async (confirmNewPerson = false) => {
    setMessage(null);
    const res: any = await addHouseholdResident(propertyId, {
      firstName: form.firstName,
      lastName: form.lastName || null,
      phone: form.phone || null,
      kindCode: form.kindCode,
      confirmNewPerson,
    });
    if (res.success === false && res.code === "DUPLICATE_PERSON") {
      setDuplicateWarning(true);
      return;
    }
    if (res.success === false) return setMessage(res.messages?.[0] ?? "No se pudo agregar");
    setDuplicateWarning(false);
    setForm({ firstName: "", lastName: "", phone: "", kindCode: form.kindCode });
    await load();
    onChanged();
  };

  const primary = async (id: number) => {
    await setPrimaryResident(id);
    await load();
  };

  const moveOut = async (id: number) => {
    const res: any = await moveOutResident(id);
    setMessage(res.data?.warning === "PROPERTY_WITHOUT_PRIMARY" ? "La propiedad se quedó sin titular: designa uno." : null);
    await load();
    onChanged();
  };

  if (loading) return <ITFlex justify="center" className="flex justify-center p-6"><ITLoader size="sm" /></ITFlex>;

  if (loadError) {
    return (
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-4">
        <ITText as="h2" className="text-lg font-bold text-slate-800">Hogar</ITText>
        <ITText as="p" role="alert" className="text-sm text-red-600">{loadError}</ITText>
        <ITButton size="sm" variant="outlined" onClick={() => void load(true)}>Reintentar</ITButton>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
      <ITText as="h2" className="text-lg font-bold text-slate-800">Hogar</ITText>

      <ul className="divide-y divide-slate-100 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="py-3 flex items-center justify-between gap-4">
            <ITText as="span">
              <strong>{r.person.firstName} {r.person.lastName ?? ""}</strong> · {r.kind.name}
              {r.isPrimary ? <em className="ml-2 text-emerald-700">Titular</em> : null}
              {!r.kind.isHouseholdMember ? <ITText as="span" className="ml-2 text-slate-400">(no cuenta en el hogar)</ITText> : null}
            </ITText>
            <ITFlex gap={2} className="flex gap-2">
              {!r.isPrimary && r.kind.isHouseholdMember && <ITButton variant="ghost" size="sm" onClick={() => void primary(r.id)}>Hacer titular</ITButton>}
              <ITButton variant="ghost" size="sm" onClick={() => void moveOut(r.id)}>Dar de baja</ITButton>
            </ITFlex>
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-slate-400">Sin residentes registrados</li>}
      </ul>

      <ITFlex direction="column" className="space-y-3 border-t border-slate-100 pt-4">
        <ITFlex direction="column" className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <ITInput name="householdFirstName" label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <ITInput name="householdLastName" label="Apellidos" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <ITInput name="householdPhone" label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <ITSearchSelect
            name="householdKind"
            label="Tipo"
            value={form.kindCode}
            onChange={(value) => setForm({ ...form, kindCode: String(value) })}
            options={kinds.map((k) => ({ label: k.name, value: k.code }))}
            clearable={false}
          />
        </ITFlex>

        {duplicateWarning && (
          <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 space-y-2">
            <ITText as="p">Ya existe una persona con estos datos.</ITText>
            <ITButton variant="outlined" onClick={() => void add(true)}>Crear de todos modos</ITButton>
          </div>
        )}
        {message && <p role="alert" className="text-sm text-red-600">{message}</p>}

        <ITButton onClick={() => void add(false)} disabled={!form.firstName.trim()}>Agregar al hogar</ITButton>
      </ITFlex>
    </section>
  );
};
