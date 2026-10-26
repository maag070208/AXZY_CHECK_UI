import {
  ITButton,
  ITCard,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITImage,
  ITPage,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaAddressBook,
  FaBuilding,
  FaEdit,
  FaEnvelope,
  FaFileAlt,
  FaIdCard,
  FaKey,
  FaPhone,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCan } from "@app/core/permissions/useCan";
import { P } from "@app/core/permissions/permissions.constants";
import { ResidentFinancePanel } from "../components/ResidentFinancePanel";
import { PersonAvatar } from "@app/core/components/PersonAvatar";
import { ResidentContactsManager } from "../components/ResidentContactsManager";
import { ResidentPassesPanel } from "../components/ResidentPassesPanel";
import {
  deleteResidentContact,
  getResidentById,
  getResidentContacts,
  ResidentContact,
  ResidentUser,
} from "../services/residents.service";

type DetailTab = "expediente" | "contactos" | "pases" | "pagos";

const TONES = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
};

const SectionHeader = ({
  icon: Icon,
  title,
  tone = TONES.emerald,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  tone?: string;
}) => (
  <ITFlex align="center" gap={2} className="mb-3">
    <ITFlex align="center" justify="center" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
      <Icon size={14} />
    </ITFlex>
    <ITText as="h3" className="text-base font-black text-slate-900 dark:text-white">
      {title}
    </ITText>
  </ITFlex>
);

const InfoTile = ({
  label,
  value,
  icon: Icon,
  tone = TONES.sky,
}: {
  label: string;
  value?: string | null;
  icon: React.ComponentType<{ size?: number }>;
  tone?: string;
}) => (
  <ITFlex align="center" gap={2} className="min-w-0 rounded-xl bg-slate-50/70 px-3 py-2 dark:bg-slate-900/40">
    <ITFlex align="center" justify="center" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone}`}>
      <Icon size={11} />
    </ITFlex>
    <ITFlex direction="column" className="min-w-0">
      <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </ITText>
      <ITText as="p" className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
        {value || "—"}
      </ITText>
    </ITFlex>
  </ITFlex>
);

const ProfileRow = ({ label, value }: { label: string; value?: string | null }) => (
  <ITFlex align="center" justify="between" gap={2} className="py-1">
    <ITText as="span" className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400">
      {label}
    </ITText>
    <ITText as="span" className="truncate text-right text-xs font-bold text-slate-700 dark:text-slate-200">
      {value || "—"}
    </ITText>
  </ITFlex>
);

export const ResidentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const can = useCan();
  const canFinance = can([P.CHARGE_VIEW, P.PAYMENT_VIEW], "all");
  const [resident, setResident] = useState<ResidentUser | null>(null);
  const [contacts, setContacts] = useState<ResidentContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("expediente");
  const [contactsOpen, setContactsOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ResidentContact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ResidentContact | null>(null);
  const [quickContactId, setQuickContactId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [residentRes, contactsRes] = await Promise.all([
        getResidentById(Number(id)),
        getResidentContacts(Number(id)),
      ]);
      if (residentRes.success && residentRes.data) setResident(residentRes.data);
      else setError("No se encontró el residente.");
      setContacts(contactsRes.data ?? []);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el expediente.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const profile = resident?.residentProfile;
  const property = resident?.property;
  const fullName = resident
    ? `${profile?.firstName || resident.name} ${profile?.fatherLastName || resident.lastName || ""}`.trim()
    : "";
  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! px-6! bg-slate-50"
      noPadding
      backAction={() => navigate("/residents")}
      loading={loading}
      error={error}
      onRetry={load}
      title={fullName || "Expediente del residente"}
      breadcrumbs={[
        { label: "Inicio", href: "#/home" },
        { label: "Directorio de Residentes", href: "#/residents" },
        { label: "Expediente" },
      ]}
      description="Expediente, contactos, pases de acceso y estado de cuenta."
      icon={<FaUserShield size={20} />}
      iconColor="#065911"
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITButton variant="outlined" color="secondary" size="md" icon={<FaAddressBook />} onClick={() => setTab("contactos")}>
            Contactos
          </ITButton>
          <ITButton color="primary" size="md" icon={<FaKey />} onClick={() => setTab("pases")}>
            Nuevo pase
          </ITButton>
          <ITButton color="warning" size="md" icon={<FaEdit />} onClick={() => navigate(`/residents/${id}/editar`)}>
            Editar expediente
          </ITButton>
        </ITFlex>
      }
    >
      <ITGrid container columns={12} spacing={5} className="w-full pb-10 pt-5">
        <ITGrid item xs={12} lg={4}>
          <ITCard className="h-fit rounded-3xl border-0! bg-white! shadow-none! lg:sticky lg:top-6" contentClassName="p-6!">
            <ITFlex direction="column" align="center" gap={3}>
              <PersonAvatar
                name={fullName}
                photoUrl={resident?.photoUrl ?? profile?.photoUrl}
                size={80}
              />
              <ITFlex direction="column" align="center" gap={1}>
                <ITText as="h2" className="text-center text-lg font-black text-slate-900 dark:text-white">
                  {fullName}
                </ITText>
                <ITText as="p" className="text-xs text-slate-400">@{resident?.username}</ITText>
              </ITFlex>
            </ITFlex>

            <ITFlex direction="column" gap={1} className="mt-4 w-full">
              <ITFlex align="center" gap={2} className="mb-1">
                <ITFlex align="center" justify="center" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <FaUserShield size={11} />
                </ITFlex>
                <ITText as="h3" className="text-sm font-black text-slate-900 dark:text-white">Información de contacto</ITText>
              </ITFlex>
              <ProfileRow label="Rol" value="Residente" />
              <ProfileRow label="Teléfono" value={profile?.phoneNumber} />
              <ProfileRow label="Correo" value={profile?.email} />
            </ITFlex>

            <ITFlex direction="column" gap={1} className="mt-4 w-full">
              <ITFlex align="center" gap={2} className="mb-1">
                <ITFlex align="center" justify="center" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                  <FaBuilding size={11} />
                </ITFlex>
                <ITText as="h3" className="text-sm font-black text-slate-900 dark:text-white">Propiedad</ITText>
              </ITFlex>
              <ProfileRow label="Propiedad" value={property?.identifier} />
              <ProfileRow label="Nombre" value={property?.name} />
            </ITFlex>

            <ITFlex direction="column" gap={1} className="mt-4 w-full">
              <ITFlex align="center" gap={2} className="mb-1">
                <ITFlex align="center" justify="center" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                  <FaPhone size={11} />
                </ITFlex>
                <ITText as="h3" className="text-sm font-black text-slate-900 dark:text-white">Contacto de emergencia</ITText>
              </ITFlex>
              <ProfileRow label="Nombre" value={profile?.emergencyContact} />
              <ProfileRow label="Teléfono" value={profile?.emergencyPhone} />
            </ITFlex>
          </ITCard>
        </ITGrid>

        <ITGrid item xs={12} lg={8}>
          <ITFlex direction="column" gap={4}>
            <ITSegmentedControl
              size="sm"
              options={[
                { value: "expediente", label: "Expediente" },
                { value: "contactos", label: `Contactos (${contacts.length})` },
                { value: "pases", label: "Pases" },
                ...(canFinance ? [{ value: "pagos", label: "Pagos" }] : []),
              ]}
              value={tab}
              onChange={(value) => setTab(value as DetailTab)}
            />

            {tab === "expediente" && resident && (
              <ITFlex direction="column" gap={4}>
                <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="p-5!">
                  <ITFlex align="center" justify="between" gap={2}>
                    <SectionHeader icon={FaIdCard} title="Identificación oficial" tone={TONES.amber} />
                    <ITButton
                      variant="outlined"
                      color="warning"
                      size="sm"
                      icon={<FaEdit />}
                      onClick={() => navigate(`/residents/${id}/editar?step=identificacion`)}
                    >
                      {profile?.ineFrontUrl || profile?.ineBackUrl ? "Actualizar INE" : "Agregar INE"}
                    </ITButton>
                  </ITFlex>
                  {profile?.ineFrontUrl || profile?.ineBackUrl ? (
                    <ITGrid container columns={12} spacing={3}>
                      {[
                        { label: "INE frontal", url: profile?.ineFrontUrl },
                        { label: "INE reverso", url: profile?.ineBackUrl },
                      ].map((ine) => (
                        <ITGrid item xs={12} sm={6} key={ine.label}>
                          <ITFlex direction="column" gap={1}>
                            <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">{ine.label}</ITText>
                            {ine.url ? (
                              <ITImage src={ine.url} alt={ine.label} fit="cover" className="h-40 w-full rounded-xl object-cover" />
                            ) : (
                              <ITText as="p" className="text-[10px] text-slate-300">Pendiente</ITText>
                            )}
                          </ITFlex>
                        </ITGrid>
                      ))}
                    </ITGrid>
                  ) : (
                    <ITEmptyState icon={<FaIdCard />} title="Sin identificación" description="Edita el expediente para subir el INE." className="py-8" />
                  )}
                </ITCard>

                <ITCard className="rounded-3xl border-0! bg-white! shadow-none!" contentClassName="p-5!">
                  <SectionHeader icon={FaFileAlt} title="Notas del expediente" tone={TONES.sky} />
                  <ITFlex className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-900/40">
                    <ITText as="p" className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {profile?.notes || "Sin notas registradas."}
                    </ITText>
                  </ITFlex>
                </ITCard>
              </ITFlex>
            )}

            {tab === "contactos" && (
              <ITCard
                className="rounded-3xl border-0! bg-white! shadow-none!"
                contentClassName="p-5!"
              >
                <ITFlex direction="column">
                  <SectionHeader icon={FaAddressBook} title="Contactos del residente" />
                  <ITText as="p" className="-mt-2 ml-11 text-xs text-slate-500">
                    Personas autorizadas o de contacto para accesos. Usa editar, eliminar o pase rápido en cada contacto.
                  </ITText>
                </ITFlex>

                {contacts.length === 0 ? (
                  <ITEmptyState
                    icon={<FaAddressBook />}
                    title="Sin contactos"
                    description="Agrega contactos para poder generarles pases."
                    className="mt-4 py-10"
                  />
                ) : (
                  <ITGrid container columns={12} spacing={2} className="mt-4">
                    {contacts.map((contact) => (
                      <ITGrid item xs={12} sm={6} key={contact.id}>
                        <ITCard
                          className="h-full rounded-2xl border-0! bg-slate-100! shadow-none!"
                          contentClassName="flex h-full flex-col gap-2 p-3!"
                        >
                          <ITFlex align="center" gap={3} wrap="wrap" className="mb-1">
                            <PersonAvatar name={contact.name} size={40} />

                            <ITFlex direction="column" className="min-w-0 flex-1">
                              <ITText as="p" className="truncate text-sm font-bold text-black">
                                {contact.name}
                              </ITText>
                              {contact.relationship && (
                                <ITText as="p" className="truncate text-[11px] text-slate-500">
                                  {contact.relationship}
                                </ITText>
                              )}
                            </ITFlex>

                            <ITFlex align="center" gap={1}>
                              <ITButton
                                size="md"
                                variant="icon-only"
                                color="warning"
                                icon={<FaEdit />}
                                onClick={() => {
                                  setEditingContact(contact);
                                  setContactsOpen(true);
                                }}
                                ariaLabel="Editar contacto"
                                title="Editar contacto"
                              />
                              <ITButton
                                size="md"
                                variant="icon-only"
                                color="danger"
                                icon={<FaTrash />}
                                onClick={() => setContactToDelete(contact)}
                                ariaLabel="Eliminar contacto"
                                title="Eliminar contacto"
                              />
                              <ITButton
                                color="primary"
                                size="md"
                                variant="icon-only"
                                icon={<FaKey />}
                                onClick={() => {
                                  setQuickContactId(contact.id);
                                  setTab("pases");
                                }}
                                ariaLabel="Pase rápido"
                                title="Pase rápido"
                              />
                            </ITFlex>
                          </ITFlex>

                          <ITFlex direction="column" gap={1}>
                            <InfoTile label="Teléfono" value={contact.phone} icon={FaPhone} tone={TONES.emerald} />
                            <InfoTile label="Correo" value={contact.email} icon={FaEnvelope} tone={TONES.sky} />
                          </ITFlex>

                        </ITCard>
                      </ITGrid>
                    ))}
                  </ITGrid>
                )}
              </ITCard>
            )}
            {tab === "pases" && resident && (
              <ResidentPassesPanel resident={resident} contacts={contacts} presetContactId={quickContactId} />
            )}
            {tab === "pagos" && resident && <ResidentFinancePanel residentId={resident.id} />}
          </ITFlex>
        </ITGrid>
      </ITGrid>

      <ResidentContactsManager
        resident={contactsOpen ? resident : null}
        isOpen={contactsOpen}
        initialContact={editingContact}
        onClose={() => {
          setContactsOpen(false);
          setEditingContact(null);
          void load();
        }}
      />

      <ITDialog
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        title="Eliminar contacto"
      >
        <ITFlex direction="column" gap={4}>
          <ITText as="p" className="text-sm text-slate-600 dark:text-slate-300">
            ¿Eliminar el contacto <ITText as="span" className="font-bold">{contactToDelete?.name}</ITText>? También dejará de estar disponible para pases.
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setContactToDelete(null)}>
              Cancelar
            </ITButton>
            <ITButton
              color="danger"
              onClick={async () => {
                if (!contactToDelete) return;
                const res = await deleteResidentContact(contactToDelete.id);
                if (res.success) {
                  dispatch(showToast({ message: "Contacto eliminado", type: "success" }));
                  setContactToDelete(null);
                  void load();
                } else {
                  dispatch(showToast({ message: res.messages?.[0] || "No se pudo eliminar", type: "error" }));
                }
              }}
            >
              Eliminar contacto
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default ResidentDetailPage;
