import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITLoader,
  ITPage,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaAddressBook,
  FaArrowRight,
  FaBan,
  FaCalendarAlt,
  FaEnvelope,
  FaHome,
  FaIdCard,
  FaPhone,
  FaPlus,
  FaQrcode,
  FaUser,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  getResidentById,
  getResidentContacts,
  ResidentContact,
  ResidentUser,
} from "@modules/residents/services/residents.service";
import {
  createInvitation,
  getPaginatedInvitations,
  Invitation,
  updateInvitationStatus,
} from "@modules/invitations/services/invitations.service";
import { InvitationForm } from "@modules/invitations/components/InvitationForm";
import { InvitationQRPrint } from "@modules/invitations/components/InvitationQRPrint";
import { useRolePalette } from "@app/core/hooks/useRolePalette";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En espera",
  ENTERED: "Dentro",
  EXITED: "Completado",
  EXPIRED: "Expirado",
  CANCELLED: "Revocado",
};

const STATUS_COLOR: Record<string, "warning" | "success" | "secondary" | "danger"> = {
  PENDING: "warning",
  ENTERED: "success",
  EXITED: "secondary",
  EXPIRED: "danger",
  CANCELLED: "danger",
};

const TABS = [
  { label: "Mi perfil", value: "perfil" },
  { label: "Contactos", value: "contactos" },
  { label: "Mis pases", value: "invitaciones" },
];

const ResidentPortalPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: any) => state.auth);
  const palette = useRolePalette();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((item) => item.value === searchParams.get("tab"))
    ? (searchParams.get("tab") as string)
    : "perfil";

  const [resident, setResident] = useState<ResidentUser | null>(null);
  const [contacts, setContacts] = useState<ResidentContact[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingQr, setViewingQr] = useState<Invitation | null>(null);
  const [revoking, setRevoking] = useState<Invitation | null>(null);

  const residentId = Number(auth.id);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [residentRes, contactsRes, invitationsRes] = await Promise.all([
        getResidentById(residentId),
        getResidentContacts(residentId),
        getPaginatedInvitations({ page: 1, limit: 50, filters: {} }),
      ]);
      if (residentRes.success && residentRes.data) setResident(residentRes.data);
      else setError("No se pudo cargar tu perfil.");
      if (contactsRes.success && contactsRes.data) setContacts(contactsRes.data);
      if (invitationsRes.success && invitationsRes.data) setInvitations(invitationsRes.data);
    } catch {
      setError("No se pudo cargar tu información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.id) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.id]);

  const changeTab = (value: string) => {
    setSearchParams(value === "perfil" ? {} : { tab: value }, { replace: true });
  };

  const wantsCreate = searchParams.get("create") === "1";
  useEffect(() => {
    if (wantsCreate && resident?.property && !createOpen) setCreateOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsCreate, resident?.property?.id]);

  const closeCreate = () => {
    setCreateOpen(false);
    if (wantsCreate) setSearchParams(tab === "perfil" ? {} : { tab }, { replace: true });
  };

  const property = resident?.property;
  const profile = resident?.residentProfile;

  const fullName = useMemo(
    () =>
      [profile?.firstName, profile?.fatherLastName, profile?.motherLastName]
        .filter(Boolean)
        .join(" ") || resident?.name || auth.name || "Residente",
    [profile, resident, auth.name],
  );

  const handleCreate = async (data: any) => {
    try {
      const res = await createInvitation({
        ...data,
        propertyId: property?.id ?? data.propertyId,
        createdById: auth.id,
      });
      if (!res.success) {
        dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo generar el pase", type: "error" }));
        return;
      }
      dispatch(showToast({ message: "Pase generado correctamente", type: "success" }));
      closeCreate();
      if (res.data) setViewingQr(res.data);
      await load();
    } catch {
      dispatch(showToast({ message: "No se pudo generar el pase", type: "error" }));
    }
  };

  const confirmRevoke = async () => {
    if (!revoking) return;
    try {
      const res = await updateInvitationStatus(revoking.id, "CANCELLED");
      if (!res.success) {
        dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo revocar", type: "error" }));
        return;
      }
      dispatch(showToast({ message: "Pase revocado", type: "success" }));
      setRevoking(null);
      await load();
    } catch {
      dispatch(showToast({ message: "No se pudo revocar el pase", type: "error" }));
    }
  };

  if (loading) {
    return (
      <ITFlex align="center" justify="center" className="h-[70vh]">
        <ITLoader size="lg" />
      </ITFlex>
    );
  }

  const firstName = fullName.split(" ")[0] || "Residente";
  const activePasses = invitations.filter((inv) => inv.status === "PENDING" || inv.status === "ENTERED");
  const upcoming = [...invitations]
    .filter((inv) => inv.status === "PENDING" || inv.status === "ENTERED")
    .sort((a, b) => +new Date(a.validFrom) - +new Date(b.validFrom))
    .slice(0, 3);

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! bg-slate-50! px-2! py-1!"
      title="Mi cuenta"
      description="Tu perfil, tus contactos y los pases de acceso de tu propiedad."
    >
      {error ? (
        <ITAlert variant="error" title="No se pudo cargar" className="mb-4">
          {error}
        </ITAlert>
      ) : null}

      <ITFlex
        direction="column"
        className="relative mb-5 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <ITFlex className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full" style={{ backgroundColor: palette.soft }} />
        <ITFlex className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full opacity-60" style={{ backgroundColor: palette.soft }} />

        <ITFlex align="start" justify="between" gap={4} wrap="wrap" className="relative z-10">
          <ITFlex align="center" gap={3}>
            <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-14 w-14 shrink-0 rounded-2xl">
              <FaUser size={23} />
            </ITFlex>
            <ITFlex direction="column" gap={1}>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: palette.primary }}>Portal del residente</ITText>
              <ITText as="h1" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Hola, {firstName}</ITText>
              <ITFlex align="center" gap={2} className="text-slate-500!">
                <FaHome size={11} />
                <ITText as="span" className="text-xs font-semibold text-slate-500!">
                  {property ? `${property.identifier} · ${property.name}` : "Sin propiedad asignada"}
                </ITText>
              </ITFlex>
            </ITFlex>
          </ITFlex>

          <ITButton
            variant="filled"
            color="primary"
            size="md"
            onClick={() => setCreateOpen(true)}
            disabled={!property}
          >
            <ITFlex align="center" gap={2}><FaPlus /> Generar invitación</ITFlex>
          </ITButton>
        </ITFlex>

        <ITGrid container columns={12} spacing={0} className="relative z-10 mt-6 border-t border-slate-100 pt-5">
          {[
            { label: "Contactos", value: contacts.length, icon: <FaAddressBook size={13} /> },
            { label: "Pases activos", value: activePasses.length, icon: <FaQrcode size={13} /> },
            { label: "Propiedad", value: property?.identifier ?? "—", icon: <FaHome size={13} /> },
          ].map((item) => (
            <ITGrid item xs={12} sm={4} key={item.label}>
              <ITFlex align="center" gap={2} className="px-0 py-2 sm:px-4">
                <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-8 w-8 rounded-xl">
                  {item.icon}
                </ITFlex>
                <ITFlex direction="column">
                  <ITText as="span" className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.label}</ITText>
                  <ITText as="span" className="text-sm font-black text-slate-900">{item.value}</ITText>
                </ITFlex>
              </ITFlex>
            </ITGrid>
          ))}
        </ITGrid>
      </ITFlex>

      <ITFlex align="center" justify="between" gap={3} wrap="wrap" className="mb-4">
        <ITSegmentedControl size="md" options={TABS} value={tab} onChange={changeTab} />
        <ITBadget color="primary" variant="outlined" size="sm">
          {property ? `${property.identifier} · ${property.name}` : "Sin propiedad asignada"}
        </ITBadget>
      </ITFlex>

      {tab === "perfil" ? (
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} lg={8}>
            <ITFlex direction="column" gap={4}>
              <ITCard title="Información personal" contentClassName="p-5!">
                <ITFlex align="center" gap={3} className="mb-5">
                  <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-14 w-14 rounded-2xl">
                    <FaUser size={22} />
                  </ITFlex>
                  <ITFlex direction="column">
                    <ITText as="p" className="text-lg font-black text-slate-900">{fullName}</ITText>
                    <ITText as="p" className="text-xs text-slate-500">@{resident?.username ?? auth.name} · Residente</ITText>
                  </ITFlex>
                  <ITBadget color="primary" variant="outlined" size="sm">Cuenta activa</ITBadget>
                </ITFlex>

                <ITGrid container columns={12} spacing={3}>
                  {[
                    { label: "Teléfono", value: profile?.phoneNumber || "—", icon: <FaIdCard /> },
                    { label: "Email", value: profile?.email || "—", icon: <FaEnvelope /> },
                    { label: "Propiedad", value: property ? `${property.identifier} · ${property.name}` : "Sin asignar", icon: <FaHome /> },
                    { label: "Emergencia", value: profile?.emergencyContact || profile?.emergencyPhone || "—", icon: <FaPhone /> },
                  ].map((item) => (
                    <ITGrid item xs={12} sm={6} key={item.label}>
                      <ITFlex align="center" gap={2} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3">
                        <ITText as="span" className="text-slate-400">{item.icon}</ITText>
                        <ITFlex direction="column" className="min-w-0">
                          <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</ITText>
                          <ITText as="span" className="truncate text-sm font-semibold text-slate-700">{item.value}</ITText>
                        </ITFlex>
                      </ITFlex>
                    </ITGrid>
                  ))}
                </ITGrid>

                <ITFlex align="center" gap={2} style={{ backgroundColor: palette.soft }} className="mt-4 rounded-xl px-3 py-2.5">
                  <FaUser size={12} style={{ color: palette.primary }} />
                  <ITText as="span" className="text-[11px] font-semibold" style={{ color: palette.primary }}>
                    Tu perfil es de solo lectura. Para cambiarlo, contacta a administración.
                  </ITText>
                </ITFlex>
              </ITCard>

              <ITCard
                title="Próximos pases"
                contentClassName="p-5!"
                headerActions={<ITButton size="sm" variant="outlined" color="secondary" onClick={() => changeTab("invitaciones")}>Ver todos</ITButton>}
              >
                {upcoming.length === 0 ? (
                  <ITFlex align="center" justify="between" gap={3} wrap="wrap" className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4">
                    <ITFlex align="center" gap={3}>
                      <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-9 w-9 rounded-xl"><FaQrcode size={14} /></ITFlex>
                      <ITFlex direction="column">
                        <ITText as="p" className="text-sm font-bold text-slate-700">Sin pases próximos</ITText>
                        <ITText as="p" className="text-[11px] text-slate-500">Genera una invitación para recibir visitas.</ITText>
                      </ITFlex>
                    </ITFlex>
                    <ITButton size="sm" variant="outlined" color="primary" onClick={() => setCreateOpen(true)} disabled={!property}>
                      <ITFlex align="center" gap={2}><FaPlus size={11} /> Generar pase</ITFlex>
                    </ITButton>
                  </ITFlex>
                ) : (
                  <ITFlex direction="column" gap={2}>
                    {upcoming.map((invitation) => (
                      <ITFlex key={invitation.id} align="center" justify="between" gap={3} className="rounded-xl border border-slate-100 px-3 py-3">
                        <ITFlex align="center" gap={3} className="min-w-0">
                          <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 shrink-0 rounded-xl">
                            <FaCalendarAlt size={15} />
                          </ITFlex>
                          <ITFlex direction="column" className="min-w-0">
                            <ITText as="p" className="truncate text-sm font-bold text-slate-800">{invitation.guestName}</ITText>
                            <ITText as="p" className="text-[11px] text-slate-500">
                              {dayjs(invitation.validFrom).format("DD MMM")} → {dayjs(invitation.validUntil).format("DD MMM")} · {invitation.code}
                            </ITText>
                          </ITFlex>
                        </ITFlex>
                        <ITFlex align="center" gap={2}>
                          <ITBadget color={STATUS_COLOR[invitation.status] ?? "secondary"} variant="outlined" size="sm">
                            {STATUS_LABEL[invitation.status] ?? invitation.status}
                          </ITBadget>
                          <ITButton size="sm" variant="outlined" color="primary" onClick={() => setViewingQr(invitation)}><FaQrcode /></ITButton>
                        </ITFlex>
                      </ITFlex>
                    ))}
                  </ITFlex>
                )}
              </ITCard>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} lg={4}>
            <ITFlex direction="column" gap={4}>
              <ITCard title="Resumen" contentClassName="p-5!">
                <ITFlex direction="column" gap={2}>
                  {[
                    { label: "Contactos registrados", value: contacts.length, icon: <FaAddressBook size={14} /> },
                    { label: "Pases activos", value: activePasses.length, icon: <FaQrcode size={14} /> },
                    { label: "Propiedad", value: property?.identifier ?? "—", icon: <FaHome size={14} /> },
                  ].map((item) => (
                    <ITFlex key={item.label} align="center" justify="between" className="rounded-xl bg-slate-50 px-3 py-3">
                      <ITFlex align="center" gap={2}>
                        <ITText as="span" style={{ color: palette.primary }}>{item.icon}</ITText>
                        <ITText as="span" className="text-xs text-slate-600">{item.label}</ITText>
                      </ITFlex>
                      <ITText as="span" className="text-base font-black" style={{ color: palette.primary }}>{item.value}</ITText>
                    </ITFlex>
                  ))}
                  <ITButton variant="filled" color="primary" size="sm" onClick={() => changeTab("invitaciones")}>
                    <ITFlex align="center" gap={2}>Ver mis pases <FaArrowRight size={10} /></ITFlex>
                  </ITButton>
                </ITFlex>
              </ITCard>

              <ITCard title="Accesos rápidos" contentClassName="p-4!">
                <ITFlex direction="column" gap={2}>
                  <ITButton variant="outlined" color="secondary" size="sm" onClick={() => changeTab("contactos")}>
                    <ITFlex align="center" gap={2}><FaAddressBook size={12} /> Mis contactos</ITFlex>
                  </ITButton>
                  <ITButton variant="outlined" color="secondary" size="sm" onClick={() => changeTab("invitaciones")}>
                    <ITFlex align="center" gap={2}><FaQrcode size={12} /> Mis pases</ITFlex>
                  </ITButton>
                  <ITButton variant="outlined" color="secondary" size="sm" onClick={() => setCreateOpen(true)} disabled={!property}>
                    <ITFlex align="center" gap={2}><FaPlus size={12} /> Generar pase</ITFlex>
                  </ITButton>
                </ITFlex>
              </ITCard>

              <ITCard title="¿Necesitas ayuda?" contentClassName="p-5!">
                <ITText as="p" className="text-xs leading-5 text-slate-500">
                  Para actualizar tus datos, contactos o accesos, comunícate con la administración de tu propiedad.
                </ITText>
                <ITFlex align="center" gap={2} className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                  <FaHome size={12} style={{ color: palette.primary }} />
                  <ITText as="span" className="text-[11px] font-bold text-slate-600">
                    {property?.identifier ?? "Sin propiedad"} · Administración
                  </ITText>
                </ITFlex>
              </ITCard>
            </ITFlex>
          </ITGrid>
        </ITGrid>
      ) : null}

      {tab === "contactos" ? (
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} lg={8}>
            <ITCard title="Mis contactos" contentClassName="p-5!">
              {contacts.length === 0 ? (
                <ITFlex align="center" gap={3} className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5">
                  <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 rounded-xl"><FaAddressBook size={16} /></ITFlex>
                  <ITFlex direction="column">
                    <ITText as="p" className="text-sm font-bold text-slate-700">Sin contactos</ITText>
                    <ITText as="p" className="text-[11px] text-slate-500">Administración aún no ha registrado contactos para ti.</ITText>
                  </ITFlex>
                </ITFlex>
              ) : (
                <ITFlex direction="column" gap={2}>
                  {contacts.map((contact) => (
                    <ITFlex key={contact.id} align="center" justify="between" gap={3} className="rounded-xl border border-slate-100 px-3 py-3">
                      <ITFlex align="center" gap={3}>
                        <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 rounded-xl">
                          <FaAddressBook size={15} />
                        </ITFlex>
                        <ITFlex direction="column">
                          <ITText as="p" className="text-sm font-bold text-slate-800">{contact.name}</ITText>
                          <ITText as="p" className="text-xs text-slate-500">
                            {[contact.phone, contact.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                          </ITText>
                        </ITFlex>
                      </ITFlex>
                      {contact.relationship ? <ITBadget color="secondary" variant="outlined" size="sm">{contact.relationship}</ITBadget> : null}
                    </ITFlex>
                  ))}
                </ITFlex>
              )}
            </ITCard>
          </ITGrid>
          <ITGrid item xs={12} lg={4}>
            <ITCard title="Contactos de confianza" contentClassName="p-5!">
              <ITText as="p" className="text-xs leading-5 text-slate-500">
                Tus contactos son de solo lectura. Administración los actualiza y pueden recibir visitas con tu autorización.
              </ITText>
              <ITFlex align="center" gap={2} style={{ backgroundColor: palette.soft }} className="mt-4 rounded-xl px-3 py-2.5">
                <FaAddressBook size={12} style={{ color: palette.primary }} />
                <ITText as="span" className="text-[11px] font-semibold" style={{ color: palette.primary }}>{contacts.length} contacto(s) registrado(s)</ITText>
              </ITFlex>
            </ITCard>
          </ITGrid>
        </ITGrid>
      ) : null}

      {tab === "invitaciones" ? (
        <ITCard
          title="Mis pases"
          headerActions={<ITButton size="sm" variant="filled" color="primary" onClick={() => setCreateOpen(true)} disabled={!property}><ITFlex align="center" gap={2}><FaPlus /> Nuevo pase</ITFlex></ITButton>}
          contentClassName="p-5!"
        >
          {invitations.length === 0 ? (
            <ITEmptyState icon={<FaQrcode />} title="Sin pases" description="Genera un pase para que tus visitantes puedan entrar." />
          ) : (
            <ITGrid container columns={12} spacing={3}>
              {invitations.map((invitation) => (
                <ITGrid item xs={12} md={6} key={invitation.id}>
                  <ITFlex direction="column" gap={3} className="h-full rounded-2xl border border-slate-100 p-4">
                    <ITFlex align="start" justify="between" gap={3}>
                      <ITFlex align="center" gap={2}>
                        <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 rounded-xl">
                          <FaCalendarAlt size={15} />
                        </ITFlex>
                        <ITFlex direction="column">
                          <ITText as="p" className="text-sm font-bold text-slate-800">{invitation.guestName}</ITText>
                          <ITText as="p" className="text-[11px] text-slate-500">{invitation.code}</ITText>
                        </ITFlex>
                      </ITFlex>
                      <ITBadget color={STATUS_COLOR[invitation.status] ?? "secondary"} variant="outlined" size="sm">
                        {STATUS_LABEL[invitation.status] ?? invitation.status}
                      </ITBadget>
                    </ITFlex>
                    <ITText as="p" className="text-xs text-slate-500">
                      {dayjs(invitation.validFrom).format("DD MMM YYYY")} → {dayjs(invitation.validUntil).format("DD MMM YYYY")}
                    </ITText>
                    <ITFlex align="center" gap={2} className="mt-auto">
                      <ITButton size="sm" variant="outlined" color="primary" onClick={() => setViewingQr(invitation)}>
                        <ITFlex align="center" gap={2}><FaQrcode size={11} /> Ver QR</ITFlex>
                      </ITButton>
                      {invitation.status === "PENDING" ? (
                        <ITButton size="sm" variant="outlined" color="danger" onClick={() => setRevoking(invitation)}>
                          <ITFlex align="center" gap={2}><FaBan size={11} /> Revocar</ITFlex>
                        </ITButton>
                      ) : null}
                    </ITFlex>
                  </ITFlex>
                </ITGrid>
              ))}
            </ITGrid>
          )}
        </ITCard>
      ) : null}

      <ITDialog isOpen={createOpen} onClose={closeCreate} title="" className="max-w-xl">
        {property ? (
          <InvitationForm
            onSubmit={handleCreate}
            onCancel={closeCreate}
            fixedProperty={{ id: property.id, label: `${property.identifier} - ${property.name}` }}
          />
        ) : (
          <ITFlex className="p-6">
            <ITAlert variant="warning">No tienes una propiedad asignada para generar pases.</ITAlert>
          </ITFlex>
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!viewingQr}
        onClose={() => setViewingQr(null)}
        title=""
        className="max-w-md bg-transparent shadow-none border-none p-0"
      >
        {viewingQr ? <InvitationQRPrint invitation={viewingQr} onClose={() => setViewingQr(null)} /> : null}
      </ITDialog>

      <ITDialog
        isOpen={!!revoking}
        onClose={() => setRevoking(null)}
        title="Revocar pase"
      >
        <ITFlex direction="column" gap={4} className="p-1">
          <ITText as="p" className="text-sm text-slate-600">
            ¿Revocar el pase de <strong>{revoking?.guestName}</strong>? Ya no podrá usarse para entrar.
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setRevoking(null)}>Cancelar</ITButton>
            <ITButton variant="filled" color="danger" onClick={() => void confirmRevoke()}>Revocar</ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default ResidentPortalPage;
