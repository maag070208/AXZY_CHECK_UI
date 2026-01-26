import { get } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface KardexFilter {
    userId?: number;
    locationId?: number;
    startDate?: string;
    endDate?: string;
}

export interface KardexEntry {
    id: number;
    userId: number;
    locationId: number;
    timestamp: string;
    notes?: string;
    media?: { url: string; type: 'IMAGE' | 'VIDEO'; description?: string }[];
    latitude?: number;
    longitude?: number;
    scanType: 'ASSIGNMENT' | 'RECURRING' | 'FREE';
    assignmentId?: number | null;
    user: {
        id: number;
        name: string;
        lastName?: string;
        username: string;
        role: string;
    };
    location: {
        id: number;
        name: string;
        aisle: string;
        spot: string;
        number: string;
    };
    assignment?: {
        id: number;
        status: string;
    } | null;
}

export const getKardex = async (filters: KardexFilter): Promise<TResult<KardexEntry[]>> => {
    let query = '';
    const params = [];
    if (filters.userId) params.push(`userId=${filters.userId}`);
    if (filters.locationId) params.push(`locationId=${filters.locationId}`);
    if (filters.startDate) params.push(`startDate=${filters.startDate}`);
    if (filters.endDate) params.push(`endDate=${filters.endDate}`);
    
    if (params.length > 0) {
        query = '?' + params.join('&');
    }

    return await get<KardexEntry[]>(`/kardex${query}`);
};
