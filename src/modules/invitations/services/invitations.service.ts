import { get, post, put } from "@app/core/axios/axios";

export interface Invitation {
    id: number;
    code: string;
    guestName: string;
    propertyId: number;
    createdById: number;
    validFrom: string;
    validUntil: string;
    status: 'PENDING' | 'ENTERED' | 'EXITED' | 'EXPIRED' | 'CANCELLED';
    typeId: number;
    type?: { id: number, name: string, value: string };
    notes?: string;
    revokedReason?: string | null;
    revokedAt?: string | null;
    revokedById?: number | null;
    entryTime?: string;
    exitTime?: string;
    property?: { id: number, identifier: string, name: string };
    createdBy?: { id: number, name: string, lastName: string };
}

export const getPaginatedInvitations = async (params: any) => {
    try {
        const result = await post<any>('/invitations/datatable', params);
        // Map to rows required by ITDataTable
        return { data: result.data.rows, total: result.data.total, success: true };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["Error fetching invitations data"] };
    }
};

export const createInvitation = async (data: any) => {
    try {
        const result = await post<any>('/invitations', data);
        return { success: result.success, data: result.data, messages: result.messages };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["Error creating invitation"] };
    }
};

export const updateInvitationStatus = async (id: number, status: string, reason?: string) => {
    try {
        const result = await put<any>(`/invitations/${id}/status`, { status, ...(reason ? { reason } : {}) });
        return { success: result.success, data: result.data, messages: result.messages };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["Error updating status"] };
    }
};

/** Busca un pase por su código (o id). Lo usa la caseta al escanear o teclear el código. */
export const getInvitationByCode = async (code: string) => {
    try {
        const result = await get<Invitation>(`/invitations/${encodeURIComponent(code)}`);
        return { success: result.success, data: result.data, messages: result.messages };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["Pase no encontrado"] };
    }
};
