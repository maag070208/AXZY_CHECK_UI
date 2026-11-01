import { axiosInstance, get, post, put } from "@app/core/axios/axios";

export interface Invitation {
    id: number;
    code: string;
    guestName: string;
    propertyId: number;
    createdById: number;
    validFrom: string;
    validUntil: string;
    status: 'PENDING_APPROVAL' | 'PENDING' | 'ENTERED' | 'EXITED' | 'EXPIRED' | 'CANCELLED';
    typeId: number;
    type?: { id: number, name: string, value: string };
    notes?: string;
    expectedPlate?: string | null;
    walkIn?: boolean;
    approvedAt?: string | null;
    approvedById?: number | null;
    revokedReason?: string | null;
    revokedAt?: string | null;
    revokedById?: number | null;
    createdAt?: string;
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

/** Lectura de un pase en caseta, por QR o tecleado. Si no puede entrar, el API deja el intento en la bitácora. */
export const scanInvitation = async (code: string) => {
    try {
        const result = await post<Invitation>('/invitations/scan', { code });
        return { success: result.success, data: result.data, messages: result.messages };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["Pase no encontrado"] };
    }
};

/** Visitas sin cita esperando autorización (el residente ve las de su casa; jefe y admin, todas). */
export const getPendingApprovals = async () => {
    try {
        const result = await get<Invitation[]>('/invitations/pending-approvals');
        return { success: result.success, data: result.data ?? [], messages: result.messages };
    } catch (error: any) {
        return { success: false, data: [], messages: error.messages || ["No se pudieron cargar las autorizaciones"] };
    }
};

/** Autoriza o rechaza una visita sin cita. El motivo es obligatorio al rechazar. */
export const decideApproval = async (id: number, decision: 'APPROVE' | 'REJECT', reason?: string) => {
    try {
        const result = await put<Invitation>(`/invitations/${id}/approval`, { decision, ...(reason ? { reason } : {}) });
        return { success: result.success, data: result.data, messages: result.messages };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["No se pudo registrar la decisión"] };
    }
};

/** Permanencia máxima y visitas dentro que ya la rebasaron. Lo usa la caseta. */
export interface CasetaStatus {
    maxStayHours: number;
    overstayedIds: number[];
}

export const getCasetaStatus = async (): Promise<{ success: boolean; data: CasetaStatus | null; messages?: string[] }> => {
    try {
        const result = await get<CasetaStatus>('/invitations/caseta-status');
        return { success: result.success, data: result.data, messages: result.messages };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["No se pudo consultar la permanencia"] };
    }
};

export interface VisitPeriod {
    period: string;
    count: number;
    deliveries: number;
}

/** Indicadores de visitas en un rango. Requiere bitácora de accesos. */
export interface VisitStats {
    maxStayHours: number;
    entries: number;
    averageStayMinutes: number | null;
    byStatus: { status: string; count: number }[];
    deliveries: number;
    byDay: VisitPeriod[];
    byWeek: VisitPeriod[];
    byMonth: VisitPeriod[];
    byHour: { hour: number; count: number }[];
    byProperty: { propertyId: number; identifier: string; entries: number; averageStayMinutes: number | null }[];
    rejected: { total: number; byReason: { reason: string; label: string; count: number }[] };
    overstayedNow: number;
    exceededStay: number;
    noExit: number;
}

export const getVisitStats = async (params: { from: string; to: string; propertyId?: number }) => {
    try {
        const result = await get<VisitStats>('/invitations/stats', { params });
        return { success: result.success, data: result.data, messages: result.messages };
    } catch (error: any) {
        return { success: false, data: null, messages: error.messages || ["No se pudieron cargar los indicadores"] };
    }
};

/** Crea un pase de visita. Con `walkIn` la caseta lo registra sin cita (el servidor fija la vigencia). */
export const createWalkInVisit = async (data: { guestName: string; propertyId: number; typeId: number; expectedPlate?: string }) => {
    const now = new Date();
    return createInvitation({
        ...data,
        walkIn: true,
        validFrom: now.toISOString(),
        validUntil: new Date(now.getTime() + 4 * 3600_000).toISOString(),
    });
};

/** Descarga los indicadores de visitas en PDF o Excel. */
export const downloadVisitStats = async (format: 'pdf' | 'xlsx', params: { from: string; to: string }) => {
    const response = await axiosInstance.get(`/invitations/stats/export.${format}`, { responseType: 'blob', params });
    const url = window.URL.createObjectURL(response.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `indicadores-visitas-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
