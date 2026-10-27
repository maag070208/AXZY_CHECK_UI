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
  FaArrowRight,
  FaClipboardList,
  FaComments,
  FaExclamationCircle,
  FaHome,
  FaQrcode,
  FaRoute,
  FaShieldAlt,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { useRolePalette } from "@app/core/hooks/useRolePalette";
import { getRounds, IRound } from "@modules/rounds/services/RoundsService";

const QUICK_ACTIONS = [
  { label: "Invitaciones", detail: "Pases de visita", icon: FaQrcode, path: "/invitations" },
  { label: "Incidencias", detail: "Reportar novedad", icon: FaExclamationCircle, path: "/incidents" },
  { label: "Casa Club", detail: "Reportes del club", icon: FaHome, path: "/club" },
  { label: "Chat", detail: "Equipo en turno", icon: FaComments, path: "/chat" },
  { label: "Mantenimiento", detail: "Reportes técnicos", icon: FaClipboardList, path: "/maintenances" },
];

export const GuardHomeDashboard = () => {
  const navigate = useNavigate();
  const auth = useSelector((state: AppState) => state.auth);
  const palette = useRolePalette();
  const [rounds, setRounds] = useState<IRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.id) return;
    getRounds(undefined, Number(auth.id))
      .then((res) => {
        if (res.success && res.data) setRounds(res.data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [auth.id]);

  const activeRound = useMemo(
    () => rounds.find((round) => round.status === "IN_PROGRESS") ?? null,
    [rounds],
  );
  const todayRounds = useMemo(
    () => rounds.filter((round) => dayjs(round.startTime).isSame(dayjs(), "day")).length,
    [rounds],
  );
  const progress = activeRound?.progressPercent ?? 0;
  const firstName = (auth.name ?? "Guardia").split(" ")[0];

  if (loading) {
    return <ITFlex align="center" justify="center" className="h-[70vh]"><ITLoader size="lg" /></ITFlex>;
  }

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! bg-slate-50! px-2! py-1!"
      title={`Hola, ${firstName}`}
      description="Tu caseta, tus accesos y las novedades del turno."
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
              <FaShieldAlt size={23} />
            </ITFlex>
            <ITFlex direction="column" gap={1}>
              <ITText as="span" className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: palette.primary }}>Operación de caseta</ITText>
              <ITText as="h1" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{firstName}</ITText>
              <ITFlex align="center" gap={2}>
                <FaShieldAlt size={11} className="text-slate-400" />
                <ITText as="span" className="text-xs font-semibold text-slate-500">Guardia · Turno en curso</ITText>
              </ITFlex>
            </ITFlex>
          </ITFlex>
          <ITBadget color={activeRound ? "primary" : "secondary"} variant="filled" size="sm">
            {activeRound ? "Ronda en curso" : "Ronda no iniciada"}
          </ITBadget>
        </ITFlex>

        <ITGrid container columns={12} spacing={0} className="relative z-10 mt-6 border-t border-slate-100 pt-5">
          {[
            { label: "Ronda", value: activeRound ? "En curso" : "Sin iniciar", icon: <FaRoute size={13} /> },
            { label: "Rondas hoy", value: todayRounds, icon: <FaClipboardList size={13} /> },
            { label: "Avance", value: activeRound ? `${progress}%` : "—", icon: <FaShieldAlt size={13} /> },
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
          <ITFlex direction="column" gap={4}>
            <ITCard title="Accesos rápidos" contentClassName="p-4!">
              <ITGrid container columns={12} spacing={2}>
                {QUICK_ACTIONS.map((action) => (
                  <ITGrid item xs={12} sm={6} md={4} key={action.label}>
                    <button
                      type="button"
                      onClick={() => navigate(action.path)}
                      className="flex h-full w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 text-left transition hover:border-[var(--color-primary-200)] hover:bg-white"
                    >
                      <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-9 w-9 shrink-0 rounded-xl">
                        <action.icon size={14} />
                      </ITFlex>
                      <ITFlex direction="column" className="min-w-0">
                        <ITText as="span" className="truncate text-xs font-bold text-slate-800">{action.label}</ITText>
                        <ITText as="span" className="truncate text-[10px] text-slate-500">{action.detail}</ITText>
                      </ITFlex>
                      <FaArrowRight className="ml-auto shrink-0 text-[10px] text-slate-300" />
                    </button>
                  </ITGrid>
                ))}
              </ITGrid>
            </ITCard>

            <ITCard
              title="Mi ronda"
              contentClassName="p-5!"
              headerActions={<ITButton size="sm" variant="outlined" color="secondary" onClick={() => navigate("/home")}>Actualizar</ITButton>}
            >
              {activeRound ? (
                <ITFlex direction="column" gap={3}>
                  <ITFlex align="center" justify="between" gap={3}>
                    <ITFlex align="center" gap={3}>
                      <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 rounded-xl"><FaRoute size={15} /></ITFlex>
                      <ITFlex direction="column">
                        <ITText as="p" className="text-sm font-bold text-slate-800">{activeRound.recurringConfiguration?.title ?? "Ronda en curso"}</ITText>
                        <ITText as="p" className="text-[11px] text-slate-500">Inicio {dayjs(activeRound.startTime).format("HH:mm")}</ITText>
                      </ITFlex>
                    </ITFlex>
                    <ITText as="span" className="text-lg font-black" style={{ color: palette.primary }}>{progress}%</ITText>
                  </ITFlex>
                  <ITFlex className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <ITFlex className="h-full rounded-full" style={{ width: `${Math.max(2, progress)}%`, backgroundColor: palette.primary }} />
                  </ITFlex>
                  <ITText as="p" className="text-[11px] text-slate-500">
                    {activeRound.scannedCount ?? 0} de {activeRound.totalLocations ?? 0} puntos completados.
                  </ITText>
                </ITFlex>
              ) : (
                <ITFlex align="center" justify="between" gap={3} wrap="wrap" className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5">
                  <ITFlex align="center" gap={3}>
                    <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 rounded-xl"><FaRoute size={16} /></ITFlex>
                    <ITFlex direction="column">
                      <ITText as="p" className="text-sm font-bold text-slate-700">No hay una ronda activa</ITText>
                      <ITText as="p" className="text-[11px] text-slate-500">Inicia tu recorrido desde la app móvil.</ITText>
                    </ITFlex>
                  </ITFlex>
                </ITFlex>
              )}
            </ITCard>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={4}>
          <ITFlex direction="column" gap={4}>
            <ITCard title="Turno" contentClassName="p-5!">
              <ITFlex direction="column" gap={2}>
                <ITFlex align="center" justify="between" className="rounded-xl bg-slate-50 px-3 py-3">
                  <ITText as="span" className="text-xs text-slate-600">Estado</ITText>
                  <ITBadget color={activeRound ? "primary" : "secondary"} variant="outlined" size="sm">{activeRound ? "En curso" : "Sin ronda"}</ITBadget>
                </ITFlex>
                <ITFlex align="center" justify="between" className="rounded-xl bg-slate-50 px-3 py-3">
                  <ITText as="span" className="text-xs text-slate-600">Rondas hoy</ITText>
                  <ITText as="span" className="text-base font-black" style={{ color: palette.primary }}>{todayRounds}</ITText>
                </ITFlex>
                <ITFlex align="center" justify="between" className="rounded-xl bg-slate-50 px-3 py-3">
                  <ITText as="span" className="text-xs text-slate-600">Avance</ITText>
                  <ITText as="span" className="text-base font-black" style={{ color: palette.primary }}>{activeRound ? `${progress}%` : "—"}</ITText>
                </ITFlex>
              </ITFlex>
            </ITCard>

            <ITCard title="¿Necesitas apoyo?" contentClassName="p-5!">
              <ITText as="p" className="text-xs leading-5 text-slate-500">
                Reporta cualquier novedad al jefe de guardias desde Incidencias o Chat.
              </ITText>
              <ITFlex direction="column" gap={2} className="mt-3">
                <ITButton variant="outlined" color="secondary" size="sm" onClick={() => navigate("/incidents")}>
                  <ITFlex align="center" gap={2}><FaExclamationCircle size={11} /> Reportar incidencia</ITFlex>
                </ITButton>
                <ITButton variant="outlined" color="secondary" size="sm" onClick={() => navigate("/chat")}>
                  <ITFlex align="center" gap={2}><FaComments size={11} /> Abrir chat</ITFlex>
                </ITButton>
              </ITFlex>
            </ITCard>
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
};
