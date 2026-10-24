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

  return (
    <ITPage
      title="Mi cuenta"
      description="Tu perfil, tus contactos y los pases de acceso de tu propiedad."
      icon={<FaUser size={20} />}
      iconColor="#065911"
      actions={
        <ITButton variant="solid" color="primary" size="md" onClick={() => setCreateOpen(true)} disabled={!property}>
          <ITFlex align="center" gap={2}>
            <FaPlus /> Generar invitación
          </ITFlex>
        </ITButton>
      }
    >
      {error ? (
        <ITAlert variant="error" title="No se pudo cargar" className="mb-4">
          {error}
        </ITAlert>
      ) : null}

      <ITFlex align="center" justify="between" gap={3} wrap="wrap" className="mb-4">
        <ITSegmentedControl size="md" options={TABS} value={tab} onChange={changeTab} />
        <ITBadget color="success" variant="filled" size="sm">
          {property ? `${property.identifier} · ${property.name}` : "Sin propiedad asignada"}
        </ITBadget>
      </ITFlex>

      {tab === "perfil" ? (
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={7}>
            <ITCard title="Mis datos" contentClassName="p-5">
              <ITFlex align="center" gap={3} className="mb-4">
                <ITFlex align="center" justify="center" className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#065911]">
                  <FaUser size={18} />
                </ITFlex>
                <ITFlex direction="column">
                  <ITText as="p" className="text-lg font-black text-slate-900">{fullName}</ITText>
                  <ITText as="p" className="text-xs text-slate-500">@{resident?.username ?? auth.name}</ITText>
                </ITFlex>
              </ITFlex>

              <ITGrid container columns={12} spacing={3}>
                <ITGrid item xs={12} sm={6}>
                  <ITFlex align="center" gap={2} className="rounded-xl bg-slate-50 px-3 py-2">
                    <FaIdCard className="text-slate-400" />
                    <ITFlex direction="column">
                      <ITText as="span" className="text-[10px] font-bold uppercase text-slate-400">Teléfono</ITText>
                      <ITText as="span" className="text-sm font-semibold text-slate-700">{profile?.phoneNumber || "—"}</ITText>
                    </ITFlex>
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={12} sm={6}>
                  <ITFlex align="center" gap={2} className="rounded-xl bg-slate-50 px-3 py-2">
                    <FaEnvelope className="text-slate-400" />
                    <ITFlex direction="column">
                      <ITText as="span" className="text-[10px] font-bold uppercase text-slate-400">Email</ITText>
                      <ITText as="span" className="text-sm font-semibold text-slate-700">{profile?.email || "—"}</ITText>
                    </ITFlex>
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={12} sm={6}>
                  <ITFlex align="center" gap={2} className="rounded-xl bg-slate-50 px-3 py-2">
                    <FaHome className="text-slate-400" />
                    <ITFlex direction="column">
                      <ITText as="span" className="text-[10px] font-bold uppercase text-slate-400">Propiedad</ITText>
                      <ITText as="span" className="text-sm font-semibold text-slate-700">
                        {property ? `${property.identifier} · ${property.name}` : "Sin asignar"}
                      </ITText>
                    </ITFlex>
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={12} sm={6}>
                  <ITFlex align="center" gap={2} className="rounded-xl bg-slate-50 px-3 py-2">
                    <FaPhone className="text-slate-400" />
                    <ITFlex direction="column">
                      <ITText as="span" className="text-[10px] font-bold uppercase text-slate-400">Emergencia</ITText>
                      <ITText as="span" className="text-sm font-semibold text-slate-700">
                        {profile?.emergencyContact || profile?.emergencyPhone || "—"}
                      </ITText>
                    </ITFlex>
                  </ITFlex>
                </ITGrid>
              </ITGrid>
              <ITAlert variant="info" className="mt-4">
                Tu perfil es de solo lectura. Para cambiarlo, contacta a administración.
              </ITAlert>
            </ITCard>
          </ITGrid>

          <ITGrid item xs={12} md={5}>
            <ITCard title="Resumen" contentClassName="p-5">
              <ITFlex direction="column" gap={3}>
                <ITFlex align="center" justify="between">
                  <ITText as="span" className="text-sm text-slate-500">Contactos registrados</ITText>
                  <ITBadget color="secondary" variant="filled" size="sm">{contacts.length}</ITBadget>
                </ITFlex>
                <ITFlex align="center" justify="between">
                  <ITText as="span" className="text-sm text-slate-500">Pases activos</ITText>
                  <ITBadget color="success" variant="filled" size="sm">
                    {invitations.filter((inv) => inv.status === "PENDING" || inv.status === "ENTERED").length}
                  </ITBadget>
                </ITFlex>
                <ITButton variant="outlined" color="secondary" size="sm" onClick={() => changeTab("invitaciones")}>
                  Ver mis pases
                </ITButton>
              </ITFlex>
            </ITCard>
          </ITGrid>
        </ITGrid>
      ) : null}

      {tab === "contactos" ? (
        <ITCard title="Mis contactos" contentClassName="p-5">
          {contacts.length === 0 ? (
            <ITEmptyState
              icon={<FaAddressBook />}
              title="Sin contactos"
              description="Administración aún no ha registrado contactos para ti."
            />
          ) : (
            <ITFlex direction="column" gap={2}>
              {contacts.map((contact) => (
                <ITFlex
                  key={contact.id}
                  align="center"
                  justify="between"
                  gap={3}
                  className="rounded-xl border border-slate-100 px-4 py-3"
                >
                  <ITFlex align="center" gap={3}>
                    <ITFlex align="center" justify="center" className="h-9 w-9 rounded-xl bg-slate-50 text-slate-500">
                      <FaAddressBook size={14} />
                    </ITFlex>
                    <ITFlex direction="column">
                      <ITText as="p" className="text-sm font-bold text-slate-800">{contact.name}</ITText>
                      <ITText as="p" className="text-xs text-slate-500">
                        {[contact.phone, contact.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                      </ITText>
                    </ITFlex>
                  </ITFlex>
                  {contact.relationship ? (
                    <ITBadget color="secondary" variant="outlined" size="sm">{contact.relationship}</ITBadget>
                  ) : null}
                </ITFlex>
              ))}
            </ITFlex>
          )}
          <ITAlert variant="info" className="mt-4">
            Tus contactos son de solo lectura. Administración los actualiza.
          </ITAlert>
        </ITCard>
      ) : null}

      {tab === "invitaciones" ? (
        <ITCard
          title="Mis pases"
          headerActions={
            <ITButton size="sm" variant="solid" color="primary" onClick={() => setCreateOpen(true)} disabled={!property}>
              <ITFlex align="center" gap={2}><FaPlus /> Nuevo pase</ITFlex>
            </ITButton>
          }
          contentClassName="p-5"
        >
          {invitations.length === 0 ? (
            <ITEmptyState
              icon={<FaQrcode />}
              title="Sin pases"
              description="Genera un pase para que tus visitantes puedan entrar."
            />
          ) : (
            <ITFlex direction="column" gap={2}>
              {invitations.map((invitation) => (
                <ITFlex
                  key={invitation.id}
                  align="center"
                  justify="between"
                  gap={3}
                  className="rounded-xl border border-slate-100 px-4 py-3"
                >
                  <ITFlex align="center" gap={3} className="min-w-0">
                    <ITFlex align="center" justify="center" className="h-9 w-9 rounded-xl bg-slate-50 text-slate-500">
                      <FaCalendarAlt size={14} />
                    </ITFlex>
                    <ITFlex direction="column" className="min-w-0">
                      <ITText as="p" className="truncate text-sm font-bold text-slate-800">
                        {invitation.guestName}
                      </ITText>
                      <ITText as="p" className="text-xs text-slate-500">
                        {dayjs(invitation.validFrom).format("DD MMM")} → {dayjs(invitation.validUntil).format("DD MMM")}
                        {" · "}
                        {invitation.code}
                      </ITText>
                    </ITFlex>
                  </ITFlex>

                  <ITFlex align="center" gap={2}>
                    <ITBadget color={STATUS_COLOR[invitation.status] ?? "secondary"} variant="filled" size="sm">
                      {STATUS_LABEL[invitation.status] ?? invitation.status}
                    </ITBadget>
                    <ITButton
                      size="sm"
                      variant="outlined"
                      color="primary"
                      onClick={() => setViewingQr(invitation)}
                    >
                      <FaQrcode />
                    </ITButton>
                    {invitation.status === "PENDING" ? (
                      <ITButton
                        size="sm"
                        variant="outlined"
                        color="danger"
                        onClick={() => setRevoking(invitation)}
                      >
                        <FaBan />
                      </ITButton>
                    ) : null}
                  </ITFlex>
                </ITFlex>
              ))}
            </ITFlex>
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
            <ITButton variant="solid" color="danger" onClick={() => void confirmRevoke()}>Revocar</ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default ResidentPortalPage;
