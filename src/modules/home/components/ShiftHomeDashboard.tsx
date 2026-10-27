import { useMemo } from "react";
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
  FaRoute,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { useRolePalette } from "@app/core/hooks/useRolePalette";
import { useLiveDashboard } from "@modules/dashboard/hooks/useLiveDashboard";

const QUICK_ACTIONS = [
  { label: "Guardias", detail: "Equipo y turnos", icon: FaUsers, path: "/guards" },
  { label: "Entrega de turno", detail: "Novedades y checklist", icon: FaClipboardList, path: "/shift-handover" },
  { label: "Nueva entrega", detail: "Registrar cambio", icon: FaClipboardList, path: "/shift-handover/nuevo" },
  { label: "Seguimiento", detail: "Rondas en vivo", icon: FaRoute, path: "/guard-tracking" },
  { label: "Incidencias", detail: "Reportes del turno", icon: FaExclamationCircle, path: "/incidents" },
  { label: "Chat", detail: "Coordinar al equipo", icon: FaComments, path: "/chat" },
  { label: "Casa Club", detail: "Reportes del club", icon: FaHome, path: "/club" },
];

export const ShiftHomeDashboard = () => {
  const navigate = useNavigate();
  const auth = useSelector((state: AppState) => state.auth);
  const palette = useRolePalette();
  const { data, loading, error, refetch } = useLiveDashboard();

  const firstName = (auth.name ?? "Jefe").split(" ")[0];
  const guards = useMemo(() => data?.guardsOnShift.slice(0, 4) ?? [], [data?.guardsOnShift]);
  const alerts = data?.alerts.slice(0, 3) ?? [];

  if (loading) {
    return <ITFlex align="center" justify="center" className="h-[70vh]"><ITLoader size="lg" /></ITFlex>;
  }

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1600px]! bg-slate-50! px-2! py-1!"
      title={`Hola, ${firstName}`}
      description="Tu turno, tu equipo y las novedades de la operación."
      actions={<ITButton size="md" variant="outlined" color="secondary" onClick={refetch}>Actualizar</ITButton>}
    >
      {error ? <ITText as="p" className="mb-3 text-xs font-semibold text-rose-600">{error}</ITText> : null}

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
              <ITText as="span" className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: palette.primary }}>Jefe de guardias</ITText>
              <ITText as="h1" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{firstName}</ITText>
              <ITText as="p" className="text-xs font-semibold text-slate-500">{dayjs().format("dddd, D [de] MMMM")} · Turno en curso</ITText>
            </ITFlex>
          </ITFlex>
          <ITBadget color="primary" variant="filled" size="sm">Operación en vivo</ITBadget>
        </ITFlex>

        <ITGrid container columns={12} spacing={0} className="relative z-10 mt-6 border-t border-slate-100 pt-5">
          {[
            { label: "Guardias en turno", value: data?.kpis.guardsOnShiftCount ?? 0, icon: <FaUsers size={13} /> },
            { label: "Rondas activas", value: data?.kpis.activeRoundsCount ?? 0, icon: <FaRoute size={13} /> },
            { label: "Incidencias abiertas", value: data?.kpis.openIncidentsCount ?? 0, icon: <FaExclamationCircle size={13} /> },
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

            <ITCard title="Equipo en turno" contentClassName="p-5!" headerActions={<ITButton size="sm" variant="outlined" color="secondary" onClick={() => navigate("/guards")}>Ver todo</ITButton>}>
              {guards.length === 0 ? (
                <ITFlex align="center" gap={3} className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5">
                  <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-10 w-10 rounded-xl"><FaUsers size={16} /></ITFlex>
                  <ITText as="p" className="text-xs text-slate-500">No hay guardias en turno en este momento.</ITText>
                </ITFlex>
              ) : (
                <ITFlex direction="column" gap={2}>
                  {guards.map((guard) => (
                    <ITFlex key={guard.guardId} align="center" justify="between" gap={3} className="rounded-xl border border-slate-100 px-3 py-3">
                      <ITFlex align="center" gap={3}>
                        <ITFlex align="center" justify="center" style={{ backgroundColor: palette.soft, color: palette.primary }} className="h-9 w-9 rounded-xl"><FaUsers size={14} /></ITFlex>
                        <ITFlex direction="column">
                          <ITText as="p" className="text-sm font-bold text-slate-800">{guard.name} {guard.lastName ?? ""}</ITText>
                          <ITText as="p" className="text-[11px] text-slate-500">{guard.status === "ON_ROUND" ? "En ronda" : "En caseta"}</ITText>
                        </ITFlex>
                      </ITFlex>
                      <ITBadget color={guard.status === "ON_ROUND" ? "primary" : "secondary"} variant="outlined" size="sm">
                        {guard.status === "ON_ROUND" ? "Ronda" : "Disponible"}
                      </ITBadget>
                    </ITFlex>
                  ))}
                </ITFlex>
              )}
            </ITCard>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={4}>
          <ITFlex direction="column" gap={4}>
            <ITCard title="Alertas del turno" contentClassName="p-5!">
              {alerts.length === 0 ? (
                <ITText as="p" className="text-xs text-slate-500">Sin alertas abiertas. Buen turno.</ITText>
              ) : (
                <ITFlex direction="column" gap={2}>
                  {alerts.map((alert, index) => (
                    <ITFlex key={`${alert.type}-${index}`} align="start" gap={2} className="rounded-xl bg-slate-50 px-3 py-3">
                      <FaExclamationCircle size={12} className={alert.severity === "high" ? "mt-0.5 text-rose-500" : "mt-0.5 text-amber-500"} />
                      <ITText as="p" className="text-[11px] leading-4 text-slate-600">{alert.message}</ITText>
                    </ITFlex>
                  ))}
                </ITFlex>
              )}
            </ITCard>

            <ITCard title="Cierre de turno" contentClassName="p-5!">
              <ITText as="p" className="text-xs leading-5 text-slate-500">
                Registra la entrega con checklist, novedades y elementos verificados.
              </ITText>
              <ITButton variant="filled" color="primary" size="sm" className="mt-3" onClick={() => navigate("/shift-handover/nuevo")}>
                <ITFlex align="center" gap={2}>Nueva entrega <FaArrowRight size={10} /></ITFlex>
              </ITButton>
            </ITCard>
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
};
