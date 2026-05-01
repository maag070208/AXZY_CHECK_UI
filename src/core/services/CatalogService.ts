import { get } from "@app/core/axios/axios";
import { CatalogOptionsType } from "../types/catalog.types";

export const getCatalogOptions = async (key: CatalogOptionsType) => {
    try {
        const res = await get<any>(`/catalog/${key}`);
        return res;
    } catch (error: any) {
        return { success: false, data: [], messages: error.messages || ["Error fetching catalog"] };
    }
};

export const getCatalogBusinessLineServiceOptions = async (id: number) => {
    try {
        const res = await get<any>(`/catalog/business-line-service/${id}`);
        return res;
    } catch (error: any) {
        return { success: false, data: [], messages: error.messages || ["Error fetching business line service catalog"] };
    }
};
