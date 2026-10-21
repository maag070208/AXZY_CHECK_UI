import {
  ITBadget,
  ITButton,
  ITCard,
  ITDatePicker,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITImage,
  ITInput,
  ITSearchSelect,
  ITText,
  ITTimePicker,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaKey, FaMapMarkerAlt, FaQrcode, FaSync, FaTrash } from "react-icons/fa";
import QRCode from "qrcode";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { createPerson, searchPersons } from "@app/modules/persons/persons.service";
import {
  Authorization,
  createAuthorization,
  issuePass,
  listAuthorizations,
  revokeAuthorization,
} from "@app/modules/properties/authorizations/authorizations.service";
import { ResidentContact, ResidentUser } from "../services/residents.service";

const SCOPE_LABEL: Record<Authorization["scope"], string> = {
  PEDESTRIAN: "Peatón",
  VEHICLE: "Vehículo",
  BOTH: "Peatón y vehículo",
};

export const ResidentPassesPanel = ({
  resident,
  contacts,
  presetContactId,
}: {
  resident: ResidentUser;
  contacts: ResidentContact[];
  presetContactId?: number | null;
}) => {
  const dispatch = useDispatch();
  const propertyId = resident.propertyId;
  const [rows, setRows] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [source, setSource] = useState<string>("");
  const [otherName, setOtherName] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  const [scope, setScope] = useState<Authorization["scope"]>("PEDESTRIAN");
  const defaultStart = useMemo(() => dayjs().add(5 - (dayjs().minute() % 5), "minute"), []);
  const defaultEnd = defaultStart.add(6, "hour");
  const [startTime, setStartTime] = useState(defaultStart.format("HH:mm"));
  const [endTime, setEndTime] = useState(defaultEnd.format("HH:mm"));
  const [validFrom, setValidFrom] = useState(defaultStart.format("YYYY-MM-DD"));
  const [validUntil, setValidUntil] = useState(defaultEnd.format("YYYY-MM-DD"));
  const [pass, setPass] = useState<{ dataUrl: string; name: string } | null>(null);

  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res: any = await listAuthorizations(propertyId);
      setRows(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (presetContactId && contacts.some((contact) => contact.id === presetContactId)) {
      setSource(`contact-${presetContactId}`);
    }
  }, [presetContactId, contacts]);

  const contactOptions = useMemo(
    () =>
      contacts.map((contact) => ({
        label: `${contact.name}${contact.phone ? ` · ${contact.phone}` : ""}`,
        value: `contact-${contact.id}`,
      })),
    [contacts],
  );

  const resolvePerson = async (name: string, phone?: string, email?: string) => {
    const query = phone || name;
    const searchRes: any = await searchPersons(query);
    const candidates = Array.isArray(searchRes) ? searchRes : searchRes.data ?? [];
    if (candidates.length > 0) return candidates[0];

    const parts = name.trim().split(" ");
    const createRes: any = await createPerson({
      firstName: parts[0] || name,
      lastName: parts.slice(1).join(" ") || null,
      phone: phone || null,
      email: email || null,
      confirmNewPerson: true,
    });
    if (createRes.success === false) throw new Error(createRes.messages?.[0] || "No se pudo crear la persona");
    return createRes.data ?? createRes;
  };

  const showPass = async (authorizationId: number, personName: string) => {
    const res: any = await issuePass(authorizationId);
    if (res.success === false) {
      dispatch(showToast({ message: res.messages?.[0] || "No se pudo generar el pase", type: "error" }));
      return;
    }
    const token = res.data?.token ?? res.token;
    const dataUrl = await QRCode.toDataURL(token, { width: 240, margin: 1 });
    setPass({ dataUrl, name: personName });
  };

  const handleCreate = async () => {
    if (!propertyId) {
      dispatch(showToast({ message: "El residente no tiene propiedad asignada", type: "warning" }));
      return;
    }
    const contact = source.startsWith("contact-")
      ? contacts.find((c) => `contact-${c.id}` === source)
      : null;
    const name = contact?.name || otherName.trim();
    if (!name) {
      dispatch(showToast({ message: "Elige un contacto o escribe el nombre", type: "warning" }));
      return;
    }

    setSaving(true);
    try {
      const person = await resolvePerson(name, contact?.phone || otherPhone, contact?.email);
      const authRes: any = await createAuthorization(propertyId, {
        personId: Number(person.id),
        scope,
        days: [0, 1, 2, 3, 4, 5, 6],
        startTime,
        endTime,
        validFrom,
        validUntil,
      });
      if (authRes.success === false) throw new Error(authRes.messages?.[0] || "No se pudo autorizar");

      const authorization = authRes.data ?? authRes;
      await showPass(Number(authorization.id), name);
      setSource("");
      setOtherName("");
      setOtherPhone("");
      void load();
    } catch (error: any) {
      dispatch(showToast({ message: error?.message || "No se pudo generar el pase", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: number) => {
    await revokeAuthorization(id);
    void load();
  };

  if (!propertyId) {
    return <ITEmptyState icon={<FaMapMarkerAlt />} title="Sin propiedad asignada" description="El residente no tiene una propiedad para generar pases." className="py-12" />;
  }

  return (
    <ITFlex direction="column" gap={4}>
      <ITCard title="Generar pase de acceso" className="rounded-3xl" contentClassName="space-y-4 p-5!">
        <ITFlex align="center" gap={3}>
          <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <FaKey size={14} />
          </ITFlex>
          <ITFlex direction="column">
            <ITText as="p" className="text-xs font-black text-slate-800 dark:text-slate-100">Contacto o visita</ITText>
            <ITText as="p" className="text-[10px] text-slate-400">Elige un contacto del residente o agrega a Rappi / otra visita.</ITText>
          </ITFlex>
        </ITFlex>

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSearchSelect
              label="Buscar contacto"
              placeholder="Contacto, Rappi u otro..."
              options={[...contactOptions, { label: "Otro / Rappi", value: "other" }]}
              value={source}
              onChange={(value) => setSource(String(value))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITSearchSelect
              label="Acceso"
              options={[
                { label: "Peatón", value: "PEDESTRIAN" },
                { label: "Vehículo", value: "VEHICLE" },
                { label: "Peatón y vehículo", value: "BOTH" },
              ]}
              value={scope}
              onChange={(value) => setScope(String(value) as Authorization["scope"])}
              clearable={false}
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITFlex align="end" className="h-full">
              <ITButton onClick={handleCreate} color="primary" size="md" icon={<FaQrcode />} className="w-full" disabled={saving}>
                {saving ? "Generando..." : "Generar pase"}
              </ITButton>
            </ITFlex>
          </ITGrid>

          {source === "other" && (
            <>
              <ITGrid item xs={12} md={6}>
                <ITInput name="otherName" label="Nombre" placeholder="Ej. Rappi" value={otherName} onChange={(e) => setOtherName(e.target.value)} onBlur={() => {}} />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput name="otherPhone" label="Teléfono (opcional)" placeholder="664..." value={otherPhone} onChange={(e) => setOtherPhone(e.target.value)} onBlur={() => {}} />
              </ITGrid>
            </>
          )}

          <ITGrid item xs={12} sm={6} md={3}>
            <ITDatePicker
              name="validFrom"
              label="Desde"
              value={validFrom ? dayjs(validFrom).toDate() : undefined}
              onChange={(e: any) => setValidFrom(e.target.value ? dayjs(e.target.value).format("YYYY-MM-DD") : "")}
              className="w-full"
            />
          </ITGrid>
          <ITGrid item xs={12} sm={6} md={3}>
            <ITDatePicker
              name="validUntil"
              label="Hasta"
              value={validUntil ? dayjs(validUntil).toDate() : undefined}
              onChange={(e: any) => setValidUntil(e.target.value ? dayjs(e.target.value).format("YYYY-MM-DD") : "")}
              className="w-full"
            />
          </ITGrid>
          <ITGrid item xs={12} sm={6} md={3}>
            <ITTimePicker name="startTime" label="Hora inicio" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </ITGrid>
          <ITGrid item xs={12} sm={6} md={3}>
            <ITTimePicker name="endTime" label="Hora fin" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </ITGrid>
        </ITGrid>
      </ITCard>

      <ITCard
        title="Pases y autorizaciones"
        className="rounded-3xl"
        contentClassName="space-y-2 p-5!"
      >
        <ITFlex justify="end">
          <ITButton variant="icon-only" color="secondary" size="sm" icon={<FaSync />} onClick={load} ariaLabel="Actualizar pases" title="Actualizar pases" />
        </ITFlex>

        {loading ? (
          <ITText as="p" className="py-6 text-center text-xs text-slate-400">Cargando pases...</ITText>
        ) : rows.length === 0 ? (
          <ITEmptyState title="Sin pases generados" description="Genera el primero con el formulario de arriba." className="py-8" />
        ) : (
          rows.map((auth) => (
            <ITFlex key={auth.id} align="center" gap={3} className="rounded-xl bg-slate-50/60 p-3 dark:bg-slate-900/40">
              <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 dark:bg-slate-800">
                <FaKey size={12} />
              </ITFlex>
              <ITFlex direction="column" className="min-w-0 flex-1">
                <ITText as="p" className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                  {auth.person.firstName} {auth.person.lastName ?? ""}
                </ITText>
                <ITText as="p" className="text-[10px] text-slate-400">
                  {SCOPE_LABEL[auth.scope]} · {dayjs(auth.validFrom).format("DD/MM")}{auth.validUntil ? `–${dayjs(auth.validUntil).format("DD/MM")}` : ""} · {auth.startTime}–{auth.endTime}
                </ITText>
              </ITFlex>
              {auth.revokedAt ? (
                <ITBadget color="danger" variant="filled" size="sm">Revocada</ITBadget>
              ) : (
                <>
                  <ITButton variant="text" color="primary" size="sm" onClick={() => showPass(auth.id, `${auth.person.firstName} ${auth.person.lastName ?? ""}`)}>
                    Generar pase
                  </ITButton>
                  <ITButton variant="icon-only" color="danger" size="sm" icon={<FaTrash />} onClick={() => revoke(auth.id)} ariaLabel="Revocar" title="Revocar" />
                </>
              )}
            </ITFlex>
          ))
        )}
      </ITCard>

      <ITDialog isOpen={!!pass} onClose={() => setPass(null)} title="Pase de acceso" className="max-w-sm w-full">
        {pass && (
          <ITFlex direction="column" align="center" gap={3}>
            <ITImage src={pass.dataUrl} alt={`Pase de ${pass.name}`} fit="contain" className="h-56 w-56 rounded-xl" />
            <ITText as="p" className="text-sm font-bold text-slate-800 dark:text-slate-100">{pass.name}</ITText>
            <ITText as="p" className="text-center text-xs text-slate-500">
              Este token se muestra una sola vez. Si generas otro, el anterior deja de funcionar.
            </ITText>
            <ITButton color="primary" onClick={() => setPass(null)} className="w-full">Cerrar</ITButton>
          </ITFlex>
        )}
      </ITDialog>
    </ITFlex>
  );
};
