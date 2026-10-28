import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITCard,
  ITChip,
  ITDialog,
  ITEmptyState,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITProgress,
  ITSegmentedControl,
  ITSkeleton,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaClipboardList,
  FaComments,
  FaDoorOpen,
  FaExclamationCircle,
  FaHome,
  FaQrcode,
  FaRoute,
  FaSearch,
  FaSignInAlt,
  FaSyncAlt,
  FaUserClock,
  FaUsers,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useRolePalette } from "@app/core/hooks/useRolePalette";
import { Invitation, updateInvitationStatus } from "@modules/invitations/services/invitations.service";
import { useCasetaData } from "./caseta/useCasetaData";
import { PassValidator } from "./caseta/PassValidator";
import { VisitRow } from "./caseta/VisitRow";
import { visitWindow, type VisitAction } from "./caseta/visit.utils";

const QUICK_ACTIONS = [
  { label: "Invitaciones", icon: FaQrcode, path: "/invitations" },
  { label: "Incidencias", icon: FaExclamationCircle, path: "/incidents" },
  { label: "Mantenimiento", icon: FaClipboardList, path: "/maintenances" },
  { label: "Casa Club", icon: FaHome, path: "/club" },
  { label: "Chat", icon: FaComments, path: "/chat" },
];

type ExpectedFilter = "today" | "all";

const matches = (inv: Invitation, query: string) => {
  if (!query) return true;
  const q = query.toLowerCase();
  return [inv.guestName, inv.code, inv.property?.identifier, inv.property?.name]
    .some((value) => value?.toLowerCase().includes(q));
};

/** Reloj de la caseta: hora y fecha, se actualiza cada 15 s. */
const useNow = () => {
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};

const ListSkeleton = () => (
  <ITFlex direction="column" gap={2}>
    {[0, 1, 2].map((i) => <ITSkeleton key={i} variant="rectangular" height={64} className="rounded-2xl" />)}
  </ITFlex>
);

const STAT_TONE: Record<string, string> = {
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
};

/** KPI de caseta con el mismo lenguaje del dashboard administrativo. */
const CasetaStat = ({ label, value, icon, tone, loading }: { label: string; value: number; icon: React.ReactNode; tone: string; loading: boolean }) => {
  if (loading) return <ITSkeleton variant="rectangular" height={96} className="rounded-2xl" />;
  return (
    <ITCard className="h-full border border-slate-100!" contentClassName="p-4!">
      <ITFlex align="center" justify="between" gap={2}>
        <ITText as="span" className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</ITText>
        <ITFlex align="center" justify="center" className={`h-8 w-8 shrink-0 rounded-lg ${STAT_TONE[tone] ?? STAT_TONE.emerald}`}>
          {icon}
        </ITFlex>
      </ITFlex>
      <ITText as="p" className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</ITText>
    </ITCard>
  );
};

/**
 * Inicio del guardia en WEB: la computadora de caseta. Prioriza quién va a llegar, quién está dentro y la
 * validación rápida de pases; la ronda se hace desde el teléfono y aquí solo se muestra su avance.
 */
export const GuardHomeDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const palette = useRolePalette();
  const now = useNow();
  const { data, error, loading, updatedAt, reload } = useCasetaData(auth.id ? Number(auth.id) : undefined);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ExpectedFilter>("today");
  const [pending, setPending] = useState<{ invitation: Invitation; action: VisitAction } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const firstName = (auth.name ?? "Guardia").split(" ")[0];

  const expected = useMemo(() => {
    const list = data?.expected ?? [];
    const scoped = filter === "today" ? list.filter((inv) => !dayjs(inv.validFrom).isAfter(now.endOf("day"))) : list;
    return scoped.filter((inv) => matches(inv, query));
  }, [data, filter, query, now]);

  const inside = useMemo(() => (data?.inside ?? []).filter((inv) => matches(inv, query)), [data, query]);
  const arrivingToday = useMemo(
    () => (data?.expected ?? []).filter((inv) => !dayjs(inv.validFrom).isAfter(now.endOf("day"))).length,
    [data, now],
  );
  const overstays = useMemo(() => (data?.inside ?? []).filter((inv) => dayjs(inv.validUntil).isBefore(now)).length, [data, now]);
  const round = data?.activeRound ?? null;
  const progress = round?.progressPercent ?? 0;

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    const res = await updateInvitationStatus(pending.invitation.id, pending.action);
    setSaving(false);
    if (res.success) {
      dispatch(showToast({
        message: pending.action === "ENTERED"
          ? `Entrada registrada: ${pending.invitation.guestName}`
          : `Salida registrada: ${pending.invitation.guestName}`,
        type: "success",
      }));
      setPending(null);
      setResetKey((key) => key + 1);
      reload();
    } else {
      dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo registrar el movimiento", type: "error" }));
    }
  };

  const openAction = (invitation: Invitation, action: VisitAction) => setPending({ invitation, action });

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! bg-slate-50! px-2! py-1!"
      title={`Caseta · ${firstName}`}
      description="Visitas por llegar, quién está dentro y validación de pases."
    >
      {/* Encabezado de caseta: reloj, turno y accesos directos en una sola tarjeta. */}
      <ITFlex
        direction="column"
        className="relative mb-5 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:p-7"
      >
        <ITFlex className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full" style={{ backgroundColor: palette.soft }} />
        <ITFlex className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full opacity-60" style={{ backgroundColor: palette.soft }} />
        <ITFlex align="start" justify="between" gap={4} wrap="wrap" className="relative z-10">
          <ITFlex align="center" gap={4}>
            <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-14 w-14 shrink-0 rounded-2xl">
              <FaDoorOpen size={24} aria-hidden="true" />
            </ITFlex>
            <ITFlex direction="column" gap={1}>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: palette.primary }}>Operación de caseta</ITText>
              <ITText as="p" className="text-4xl font-black tracking-tight text-slate-900 tabular-nums" aria-live="off">
                {now.format("HH:mm")}
              </ITText>
              <ITText as="span" className="text-xs font-semibold capitalize text-slate-500">{now.format("dddd, D [de] MMMM")}</ITText>
            </ITFlex>
          </ITFlex>

          <ITFlex direction="column" align="end" gap={2}>
            <ITChip
              color={round ? "success" : "gray"}
              variant="outlined"
              icon={<FaRoute size={10} />}
              label={round ? `Ronda en curso · ${progress}%` : "Ronda no iniciada"}
            />
            <ITText as="span" className="text-[10px] font-semibold text-slate-400">
              {round ? "La ronda se controla desde el teléfono" : "La ronda se inicia desde el teléfono"}
            </ITText>
            <ITButton size="sm" variant="outlined" color="secondary" onClick={reload}>
              <ITFlex align="center" gap={2}>
                <FaSyncAlt size={10} /> {updatedAt ? `Actualizado ${dayjs(updatedAt).format("HH:mm")}` : "Actualizar"}
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" gap={2} wrap="wrap" className="relative z-10 mt-5 border-t border-slate-100 pt-4">
          <ITText as="span" className="mr-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Accesos rápidos</ITText>
          {QUICK_ACTIONS.map((action) => (
            <ITButton key={action.label} variant="outlined" color="secondary" size="sm" onClick={() => navigate(action.path)}>
              <ITFlex align="center" gap={2}><action.icon size={11} /> {action.label}</ITFlex>
            </ITButton>
          ))}
        </ITFlex>
      </ITFlex>

      {error && !data && (
        <ITAlert variant="error" title="No se pudieron cargar las visitas" className="mb-4">
          <ITFlex align="center" justify="between" gap={3} wrap="wrap">
            <ITText as="span" className="text-sm">{error}</ITText>
            <ITButton size="sm" variant="outlined" color="danger" onClick={reload}>Reintentar</ITButton>
          </ITFlex>
        </ITAlert>
      )}

      {/* Indicadores del turno */}
      <ITGrid container columns={12} spacing={3} className="mb-5">
        {[
          { label: "Por llegar hoy", value: arrivingToday, icon: <FaUserClock />, tone: "amber" },
          { label: "Dentro ahora", value: data?.inside.length ?? 0, icon: <FaUsers />, tone: "emerald" },
          { label: "Entradas hoy", value: data?.entriesToday ?? 0, icon: <FaSignInAlt />, tone: "sky" },
          { label: "Pase vencido dentro", value: overstays, icon: <FaExclamationCircle />, tone: "rose" },
        ].map((stat) => (
          <ITGrid item xs={6} lg={3} key={stat.label}>
            <CasetaStat label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} loading={loading && !data} />
          </ITGrid>
        ))}
      </ITGrid>

      <ITGrid container columns={12} spacing={4} className="items-stretch">
        <ITGrid item xs={12} xl={8}>
          <ITFlex direction="column" gap={4}>
            <ITCard title="Validar pase" className="h-full" contentClassName="p-5!">
              <PassValidator onAction={openAction} resetKey={resetKey} />
            </ITCard>

            <ITCard
              title="Por llegar"
              className="h-auto! self-start! w-full"
              contentClassName="p-5!"
              headerActions={
                <ITSegmentedControl
                  size="sm"
                  options={[
                    { value: "today", label: "Hoy" },
                    { value: "all", label: "Próximos días" },
                  ]}
                  value={filter}
                  onChange={(value) => setFilter(value as ExpectedFilter)}
                />
              }
            >
              <ITFlex direction="column" gap={3}>
                <ITInput
                  name="visit-search"
                  placeholder="Buscar por nombre, casa o código"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  iconLeft={<FaSearch />}
                  maxLength={60}
                />
                {loading && !data ? (
                  <ListSkeleton />
                ) : expected.length === 0 ? (
                  <ITEmptyState
                    icon={<FaUserClock size={32} />}
                    title={query ? "Sin coincidencias" : "Nadie por llegar"}
                    description={query ? "Prueba con otro nombre, casa o código." : "Cuando un residente genere un pase, aparecerá aquí."}
                  />
                ) : (
                  <ITText as="ul" className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Visitas por llegar">
                    {expected.map((inv) => <VisitRow key={inv.id} invitation={inv} mode="expected" onAction={openAction} />)}
                  </ITText>
                )}
              </ITFlex>
            </ITCard>
            <ITCard title="Mi ronda" contentClassName="p-5!">
              {round ? (
                <ITFlex direction="column" gap={2}>
                  <ITFlex align="center" justify="between">
                    <ITText as="p" className="text-sm font-bold text-slate-800">{round.recurringConfiguration?.title ?? "Ronda en curso"}</ITText>
                    <ITText as="span" className="text-lg font-black" style={{ color: palette.primary }}>{progress}%</ITText>
                  </ITFlex>
                  <ITProgress value={progress} size="sm" />
                  <ITText as="p" className="text-[11px] text-slate-500">
                    {round.scannedCount ?? 0} de {round.totalLocations ?? 0} puntos · inicio {dayjs(round.startTime).format("HH:mm")}
                  </ITText>
                </ITFlex>
              ) : (
                <ITText as="p" className="text-xs leading-5 text-slate-500">
                  No hay ronda activa. Las rondas se inician y escanean desde la app del teléfono.
                </ITText>
              )}
            </ITCard>

          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} xl={4}>
          <ITFlex direction="column" gap={4} className="h-full">
            <ITCard
              title="Dentro del residencial"
              className="h-full"
              contentClassName="p-5!"
              headerActions={<ITChip size="sm" color="success" label={`${data?.inside.length ?? 0}`} />}
            >
              {loading && !data ? (
                <ListSkeleton />
              ) : inside.length === 0 ? (
                <ITEmptyState icon={<FaUsers size={32} />} title="No hay visitas dentro" description="Las entradas que registres aparecerán aquí." />
              ) : (
                <ITText as="ul" className="m-0 flex max-h-[520px] list-none flex-col gap-2 overflow-y-auto p-0" aria-label="Visitas dentro">
                  {inside.map((inv) => <VisitRow key={inv.id} invitation={inv} mode="inside" onAction={openAction} />)}
                </ITText>
              )}
            </ITCard>



          </ITFlex>
        </ITGrid>
      </ITGrid>

      <ITDialog
        isOpen={!!pending}
        onClose={() => !saving && setPending(null)}
        title={pending?.action === "ENTERED" ? "Registrar entrada" : "Registrar salida"}
        className="max-w-md"
      >
        {pending && (
          <ITFlex direction="column" gap={4} className="p-1">
            <ITFlex direction="column" gap={1} className="rounded-2xl bg-slate-50 p-4">
              <ITText as="p" className="text-lg font-black text-slate-900">{pending.invitation.guestName}</ITText>
              <ITText as="p" className="text-xs text-slate-600">
                Casa {pending.invitation.property?.identifier ?? pending.invitation.property?.name} · {visitWindow(pending.invitation)}
              </ITText>
              <ITText as="p" className="text-[11px] font-bold tracking-wider text-slate-400">{pending.invitation.code}</ITText>
            </ITFlex>
            {pending.action === "ENTERED" && (
              <ITText as="p" className="text-xs text-slate-500">
                Verifica la identificación de la visita antes de confirmar. Si la casa tiene adeudo, el sistema bloqueará la entrada.
              </ITText>
            )}
            <ITFlex justify="end" gap={2}>
              <ITButton variant="text" color="gray" onClick={() => setPending(null)} disabled={saving}>Cancelar</ITButton>
              <ITButton onClick={confirm} disabled={saving}>
                {saving ? "Registrando…" : pending.action === "ENTERED" ? "Confirmar entrada" : "Confirmar salida"}
              </ITButton>
            </ITFlex>
          </ITFlex>
        )}
      </ITDialog>
    </ITPage>
  );
};
