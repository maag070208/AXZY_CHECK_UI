import { useEffect, useMemo, useState } from "react";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaAddressBook,
  FaArrowRight,
  FaCalendarAlt,
  FaHome,
  FaPlus,
  FaQrcode,
  FaUser,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { useRolePalette } from "@app/core/hooks/useRolePalette";
import { getResidentById, getResidentContacts, ResidentContact, ResidentUser } from "@modules/residents/services/residents.service";
import { getPaginatedInvitations, Invitation } from "@modules/invitations/services/invitations.service";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En espera",
  ENTERED: "Dentro",
  EXITED: "Completado",
  CANCELLED: "Revocado",
  EXPIRED: "Expirado",
};

const STATUS_COLOR: Record<string, "warning" | "success" | "secondary" | "danger"> = {
  PENDING: "warning",
  ENTERED: "success",
  EXITED: "secondary",
  CANCELLED: "danger",
  EXPIRED: "danger",
};

export const ResidentHomeDashboard = () => {
  const navigate = useNavigate();
  const auth = useSelector((state: AppState) => state.auth);
  const palette = useRolePalette();
  const [resident, setResident] = useState<ResidentUser | null>(null);
  const [contacts, setContacts] = useState<ResidentContact[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.id) return;
    Promise.all([
      getResidentById(Number(auth.id)),
      getResidentContacts(Number(auth.id)),
      getPaginatedInvitations({ page: 1, limit: 50, filters: {} }),
    ])
      .then(([residentRes, contactsRes, invitationsRes]) => {
        if (residentRes.success && residentRes.data) setResident(residentRes.data);
        if (contactsRes.success && contactsRes.data) setContacts(contactsRes.data);
        if (invitationsRes.success && invitationsRes.data) setInvitations(invitationsRes.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [auth.id]);

  const property = resident?.property;
  const profile = resident?.residentProfile;
  const fullName = [profile?.firstName, profile?.fatherLastName, profile?.motherLastName]
    .filter(Boolean)
    .join(" ") || resident?.name || auth.name || "Residente";
  const activePasses = useMemo(
    () => invitations.filter((inv) => inv.status === "PENDING" || inv.status === "ENTERED"),
    [invitations],
  );
  const upcoming = useMemo(
    () => [...activePasses].sort((a, b) => +new Date(a.validFrom) - +new Date(b.validFrom)).slice(0, 3),
    [activePasses],
  );

  if (loading) {
    return <ITFlex align="center" justify="center" className="h-[70vh]"><ITLoader size="lg" /></ITFlex>;
  }

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! bg-slate-50! px-2! py-1!"
      title={`Hola, ${fullName.split(" ")[0]}`}
      description="Tu comunidad, tus visitas y tus accesos en un solo lugar."
    >
      <ITFlex
        direction="column"
        className="relative mb-5 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <ITFlex className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full" style={{ backgroundColor: palette.soft }} />
        <ITFlex className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full opacity-60" style={{ backgroundColor: palette.soft }} />
        <ITFlex align="start" justify="between" gap={4} wrap="wrap" className="relative z-10">
          <ITFlex align="center" gap={3}>
            <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-14 w-14 shrink-0 rounded-2xl">
              <FaUser size={23} />
            </ITFlex>
            <ITFlex direction="column" gap={1}>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: palette.primary }}>Mi comunidad</ITText>
              <ITText as="h1" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{fullName}</ITText>
              <ITFlex align="center" gap={2}>
                <FaHome size={11} className="text-slate-400" />
                <ITText as="span" className="text-xs font-semibold text-slate-500">
                  {property ? `${property.identifier} · ${property.name}` : "Sin propiedad asignada"}
                </ITText>
              </ITFlex>
            </ITFlex>
          </ITFlex>
          <ITButton variant="filled" color="primary" size="md" onClick={() => navigate("/resident?tab=invitaciones&create=1")}>
            <ITFlex align="center" gap={2}><FaPlus /> Generar invitación</ITFlex>
          </ITButton>
        </ITFlex>

        <ITGrid container columns={12} spacing={0} className="relative z-10 mt-6 border-t border-slate-100 pt-5">
          {[
            { label: "Pases activos", value: activePasses.length, icon: <FaQrcode size={13} /> },
            { label: "Contactos", value: contacts.length, icon: <FaAddressBook size={13} /> },
            { label: "Propiedad", value: property?.identifier ?? "—", icon: <FaHome size={13} /> },
          ].map((item) => (
            <ITGrid item xs={12} sm={4} key={item.label}>
              <ITFlex align="center" gap={2} className="px-0 py-2 sm:px-4">
                <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-8 w-8 rounded-xl">{item.icon}</ITFlex>
                <ITFlex direction="column">
                  <ITText as="span" className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.label}</ITText>
                  <ITText as="span" className="text-sm font-black text-slate-900">{item.value}</ITText>
                </ITFlex>
              </ITFlex>
            </ITGrid>
          ))}
        </ITGrid>
      </ITFlex>

      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={12} lg={8}>
          <ITCard
            title="Próximos pases"
            contentClassName="p-5!"
            headerActions={<ITButton size="sm" variant="outlined" color="secondary" onClick={() => navigate("/resident?tab=invitaciones")}>Ver todos</ITButton>}
          >
            {upcoming.length === 0 ? (
              <ITFlex align="center" justify="between" gap={3} wrap="wrap" className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5">
                <ITFlex align="center" gap={3}>
                  <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 rounded-xl"><FaQrcode size={16} /></ITFlex>
                  <ITFlex direction="column">
                    <ITText as="p" className="text-sm font-bold text-slate-700">Aún no tienes visitas programadas</ITText>
                    <ITText as="p" className="text-[11px] text-slate-500">Genera un pase y compártelo con tu visita.</ITText>
                  </ITFlex>
                </ITFlex>
                <ITButton size="sm" variant="filled" color="primary" onClick={() => navigate("/resident?tab=invitaciones&create=1")}>
                  <ITFlex align="center" gap={2}><FaPlus size={11} /> Generar pase</ITFlex>
                </ITButton>
              </ITFlex>
            ) : (
              <ITFlex direction="column" gap={2}>
                {upcoming.map((invitation) => (
                  <ITFlex key={invitation.id} align="center" justify="between" gap={3} className="rounded-xl border border-slate-100 px-3 py-3">
                    <ITFlex align="center" gap={3} className="min-w-0">
                      <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 shrink-0 rounded-xl"><FaCalendarAlt size={15} /></ITFlex>
                      <ITFlex direction="column" className="min-w-0">
                        <ITText as="p" className="truncate text-sm font-bold text-slate-800">{invitation.guestName}</ITText>
                        <ITText as="p" className="text-[11px] text-slate-500">
                          {dayjs(invitation.validFrom).format("DD MMM")} → {dayjs(invitation.validUntil).format("DD MMM")} · {invitation.code}
                        </ITText>
                      </ITFlex>
                    </ITFlex>
                    <ITBadget color={STATUS_COLOR[invitation.status] ?? "secondary"} variant="filled" size="sm">
                      {STATUS_LABEL[invitation.status] ?? invitation.status}
                    </ITBadget>
                  </ITFlex>
                ))}
              </ITFlex>
            )}
          </ITCard>
        </ITGrid>

        <ITGrid item xs={12} lg={4}>
          <ITFlex direction="column" gap={4}>
            <ITCard title="Accesos rápidos" contentClassName="p-4!">
              <ITFlex direction="column" gap={2}>
                <ITButton variant="outlined" color="secondary" size="sm" onClick={() => navigate("/resident?tab=perfil")}>
                  <ITFlex align="center" gap={2}><FaUser size={12} /> Mi perfil</ITFlex>
                </ITButton>
                <ITButton variant="outlined" color="secondary" size="sm" onClick={() => navigate("/resident?tab=contactos")}>
                  <ITFlex align="center" gap={2}><FaAddressBook size={12} /> Mis contactos</ITFlex>
                </ITButton>
                <ITButton variant="outlined" color="secondary" size="sm" onClick={() => navigate("/resident?tab=invitaciones")}>
                  <ITFlex align="center" gap={2}><FaQrcode size={12} /> Mis pases</ITFlex>
                </ITButton>
              </ITFlex>
            </ITCard>

            <ITCard title="Tu propiedad" contentClassName="p-5!">
              <ITFlex align="center" gap={3}>
                <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-11 w-11 rounded-xl"><FaHome size={17} /></ITFlex>
                <ITFlex direction="column">
                  <ITText as="p" className="text-sm font-bold text-slate-800">{property?.identifier ?? "Sin asignar"}</ITText>
                  <ITText as="p" className="text-[11px] text-slate-500">{property?.name ?? "Contacta a administración"}</ITText>
                </ITFlex>
              </ITFlex>
              <ITButton variant="outlined" color="secondary" size="sm" className="mt-3" onClick={() => navigate("/resident?tab=perfil")}>
                <ITFlex align="center" gap={2}>Ver mi perfil <FaArrowRight size={10} /></ITFlex>
              </ITButton>
            </ITCard>
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
};
