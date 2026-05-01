import { get, post, put, remove } from "@app/core/axios/axios";
import { ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";

export interface Property {
    id: number;
    identifier: string;
    name: string;
    typeId: number;
    type?: { id: number, name: string, value: string };
    mainStreet: string;
    betweenStreets?: string;
    latitude?: number;
    longitude?: number;
    statusId: number;
    status?: { id: number, name: string, value: string };
    active: boolean;
}

export const getPropertiesList = async () => {
    return await get<Property[]>("/properties");
};

export const createProperty = async (data: any) => {
    return await post<Property>("/properties", data);
};

export const updateProperty = async (id: number, data: any) => {
    return await put<Property>(`/properties/${id}`, data);
};

export const deleteProperty = async (id: number) => {
    return await remove(`/properties/${id}`);
};

export const getPropertyById = async (id: number) => {
    return await get<Property>(`/properties/${id}`);
};

export const getPaginatedProperties = async (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Property>> => {
    const res = await post<any>("/properties/datatable", params);
    if (res.success && res.data) {
        return {
            data: res.data.rows || [],
            total: res.data.total || 0,
        };
    }
    return { data: [], total: 0 };
};

export const getPropertyTypes = async () => {
    return await get<any[]>("/catalog/property_type");
};
