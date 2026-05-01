
import { get } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface IGuardReportFilters {
    startDate: string;
    endDate: string;
    guardId?: number;
}

export interface IGuardStats {
    totalIncidents: number;
    totalScans: number;
    incompleteRounds: number;
    missedScans: number;
}

export interface ITopPerformance {
    guardId: number;
    name: string;
    lastName: string;
    totalScans: number;
}

export interface IGuardWorkload {
    guardId: number;
    name: string;
    lastName: string;
    role: string;
    workload: number;
    details: {
        scans: number;
        reports: number;
        rounds: number;
    }
}

export interface IGuardDetail {
    guardId: number;
    name: string;
    lastName: string;
    role: string;
    totalRounds: number;
    totalScans: number;
    incompleteRounds: number;
    missedScans: number;
    avgRoundTimeMinutes: number;
}

export interface IMissedPoint {
    roundId: number;
    startTime: string;
    locationId: number;
    locationName: string;
    aisle: string;
}

export interface IIncompleteRound {
    roundId: number;
    startTime: string;
    endTime: string;
    missedCount: number;
    totalLocations: number;
}

export interface IGuardDetailBreakdown {
    missedPoints: IMissedPoint[];
    incompleteRounds: IIncompleteRound[];
}

export const getGuardStats = async (filters: IGuardReportFilters): Promise<TResult<IGuardStats>> => {
    return get<IGuardStats>("/reports/guards/stats", { params: filters });
};

export const getTopPerformance = async (filters: IGuardReportFilters): Promise<TResult<ITopPerformance[]>> => {
    return get<ITopPerformance[]>("/reports/guards/top-performance", { params: filters });
};

export const getDistribution = async (filters: IGuardReportFilters): Promise<TResult<IGuardStats>> => {
    return get<IGuardStats>("/reports/guards/distribution", { params: filters });
};

export const getDetailedReport = async (filters: IGuardReportFilters): Promise<TResult<IGuardDetail[]>> => {
    return get<IGuardDetail[]>("/reports/guards/detail", { params: filters });
};

export const getGuardDetailBreakdown = async (guardId: number, filters: IGuardReportFilters): Promise<TResult<IGuardDetailBreakdown>> => {
    return get<IGuardDetailBreakdown>(`/reports/guards/detail-breakdown/${guardId}`, { params: filters });
};

export const getWorkloadComparison = async (filters: IGuardReportFilters): Promise<TResult<IGuardWorkload[]>> => {
    return get<IGuardWorkload[]>("/reports/guards/workload", { params: filters });
};
