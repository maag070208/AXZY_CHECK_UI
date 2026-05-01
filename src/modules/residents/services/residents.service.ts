import { get, post, put, remove } from "@app/core/axios/axios";
import { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";
import { Property } from "@modules/properties/service/properties.service";

export interface ResidentProfile {
    id: number;
    userId: number;
    firstName?: string;
    fatherLastName?: string;
    motherLastName?: string;
    phoneNumber?: string;
    email?: string;
    ineFrontUrl?: string;
    ineBackUrl?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    notes?: string;
}

export interface ResidentUser {
    id: number;
    name: string;
    lastName?: string;
    username: string;
    role: string;
    propertyId?: number;
    property?: Property;
    residentProfile?: ResidentProfile;
}

export const getResidentsList = async () => {
    return await get<ResidentUser[]>("/residents");
};

export const createResident = async (data: any) => {
    return await post<ResidentUser>("/residents", data);
};

export const updateResident = async (id: number, data: any) => {
    return await put<ResidentUser>(`/residents/${id}`, data);
};

export const deleteResident = async (id: number) => {
    return await remove(`/residents/${id}`);
};

export const getResidentById = async (id: number) => {
    return await get<ResidentUser>(`/residents/${id}`);
};

export const getPaginatedResidents = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<ResidentUser>> => {
    const res = await post<any>("/residents/datatable", params);
    if (res.success && res.data) {
        return {
            data: res.data.rows || [],
            total: res.data.total || 0,
        };
    }
    return { data: [], total: 0 };
};

export const uploadResidentImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    
    // We cast to any because axios wrapper might not be overloaded for FormData content-type cleanly
    const res = await post<any>("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });

    if (res.success && res.data?.url) {
        return res.data.url;
    }
    return null;
};

// CONTACTS SERVICE
export interface ResidentContact {
    id: number;
    userId: number;
    name: string;
    phone?: string;
    email?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getResidentContacts = async (residentId: number) => {
    return await get<ResidentContact[]>(`/residents/${residentId}/contacts`);
};

export const createResidentContact = async (residentId: number, data: any) => {
    return await post<ResidentContact>(`/residents/${residentId}/contacts`, data);
};

export const updateResidentContact = async (id: number, data: any) => {
    return await put<ResidentContact>(`/residents/contacts/${id}`, data);
};

export const deleteResidentContact = async (id: number) => {
    return await remove(`/residents/contacts/${id}`);
};
