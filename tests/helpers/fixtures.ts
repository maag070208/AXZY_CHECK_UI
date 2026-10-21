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
