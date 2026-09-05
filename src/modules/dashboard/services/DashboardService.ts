import { get } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

/**
 * "Dashboard administrativo en vivo" (Home de WEB para ADMIN/SHIFT). A
 * diferencia de home/services/ReportService.ts (histórico, por rango de
 * fechas), esto es una sola foto del estado operativo AHORA MISMO.
 */

export interface ILiveGuardRef {
  id: number;
  name: string;
  lastName: string | null;
}

export interface ILiveScan {
  locationName: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ILiveActiveRound {
  roundId: number;
  guard: ILiveGuardRef;
  routeId: number | null;
  routeTitle: string | null;
  startTime: string;
  elapsedMinutes: number;
  totalLocations: number | null;
  scannedCount: number;
  progressPercent: number | null;
  lastScan: ILiveScan | null;
  stale: boolean;
}

export interface ILiveMapPoint {
  guardId: number;
  guardName: string;
  roundId: number;
  routeTitle: string | null;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface ILiveGuardOnShift {
  guardId: number;
  name: string;
  lastName: string | null;
  role: string;
  status: "ON_ROUND" | "IDLE";
  lastActivityAt: string | null;
  uniformCheckPending: boolean;
}

export interface ILiveAlert {
  type: "ROUND_STALLED" | "INCIDENT_OPEN" | "SHIFT_HANDOVER_OVERDUE";
  severity: "high" | "medium";
  message: string;
  refId?: number;
  /** Ausente cuando la alerta no tiene un momento puntual que mostrar. */
  at?: string | null;
}

export interface ILiveUncoveredRoute {
  id: number;
  title: string;
}

export interface ILiveDashboard {
  generatedAt: string;
  kpis: {
    activeRoundsCount: number;
    guardsOnShiftCount: number;
    openIncidentsCount: number;
    routesTotal: number;
    routesCovered: number;
  };
  activeRounds: ILiveActiveRound[];
  mapPoints: ILiveMapPoint[];
  guardsOnShift: ILiveGuardOnShift[];
  alerts: ILiveAlert[];
  uncoveredRoutes: ILiveUncoveredRoute[];
}

export const getLiveDashboard = async (): Promise<TResult<ILiveDashboard>> => {
  return await get<ILiveDashboard>("/dashboard/live");
};

/** @description Requests a subscribe-only Ably TokenRequest for realtime updates (shared with chat). */
export const getRealtimeToken = async (): Promise<TResult<any>> => {
  return await get<any>("/realtime/token");
};
