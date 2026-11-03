import { get, post, patch } from "@app/core/axios/axios";
import { fetchDataTable } from "@app/core/services/table-fetcher.service";
import { ITDataTableFetchParams, ITDataTableResponse } from "@app/core/types/datatable.types";
import {
    Assignment,
    CreateAssignmentDTO,
    CreateGuardAssignmentDTO,
    GuardAssignment,
} from "../types/guards.types";

export const getGuardsDataTable = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<any>> => {
    // Add default filters for guard roles if not present
    const updatedParams = { ...params };
    if (!updatedParams.filters) updatedParams.filters = {};
    
    return await fetchDataTable<any>("/users/datatable", updatedParams);
};

export const createAssignment = async (data: CreateAssignmentDTO) => {
    return await post<Assignment>("/assignments", data);
};

export const getActiveAssignments = async (guardId: number) => {
    return await get<Assignment[]>(`/assignments?guardId=${guardId}`);
};

export const getAllAssignmentsByGuard = async (guardId: number) => {
    return await get<Assignment[]>(`/assignments/all?guardId=${guardId}`);
};

export const updateAssignmentStatus = async (id: number, status: string) => {
    return await patch<Assignment>(`/assignments/${id}/status`, { status });
};

/** Asignación de guardia → cliente (fase 3). Una activa por guardia como máximo. */
export const getGuardAssignments = async (params: { guardId?: number; clientId?: number; active?: boolean } = {}) => {
    const search = new URLSearchParams();
    if (params.guardId !== undefined) search.set("guardId", String(params.guardId));
    if (params.clientId !== undefined) search.set("clientId", String(params.clientId));
    if (params.active !== undefined) search.set("active", String(params.active));
    const query = search.toString();
    return await get<GuardAssignment[]>(`/guard-assignments${query ? `?${query}` : ""}`);
};

export const createGuardAssignment = async (data: CreateGuardAssignmentDTO) => {
    return await post<GuardAssignment>("/guard-assignments", data);
};

export const endGuardAssignment = async (id: number) => {
    return await post<GuardAssignment>(`/guard-assignments/${id}/end`, {});
};
