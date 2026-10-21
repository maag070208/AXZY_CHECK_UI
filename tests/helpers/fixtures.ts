import type { ILiveDashboard } from "@app/modules/dashboard/services/DashboardService";

export const liveDashboard = (over: Partial<ILiveDashboard> = {}): ILiveDashboard => ({
  generatedAt: "2026-10-20T12:00:00.000Z",
  kpis: { activeRoundsCount: 0, guardsOnShiftCount: 0, openIncidentsCount: 0, routesTotal: 0, routesCovered: 0 },
  activeRounds: [],
  mapPoints: [],
  guardsOnShift: [],
  alerts: [],
  uncoveredRoutes: [],
  insights: {
    today: {
      roundsStarted: 0,
      roundsCompleted: 0,
      incidentsCreated: 0,
      yesterdayRoundsStarted: 0,
      yesterdayRoundsCompleted: 0,
      yesterdayIncidentsCreated: 0,
    },
    avgRoundMinutes: null,
    avgResolutionMinutes: null,
    roundsByDay: [],
    incidentsByDay: [],
    incidentsByCategory: [],
    incidentsByHour: [],
    timeline: [],
  },
  ...over,
});

export const roles = [
  { id: 1, name: "ADMIN", value: "Administrador" },
  { id: 2, name: "GUARD", value: "Guardia" },
  { id: 3, name: "SHIFT", value: "Supervisor" },
  { id: 4, name: "MAINT", value: "Mantenimiento" },
  { id: 5, name: "CLIENT", value: "Cliente" },
];

export const schedules = [
  { id: 1, name: "Matutino", startTime: "07:00", endTime: "15:00", active: true },
  { id: 2, name: "Nocturno", startTime: "19:00", endTime: "07:00", active: false },
];
