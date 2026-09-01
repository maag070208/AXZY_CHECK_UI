import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface Maintenance {
  id: number;
  title: string;
  description: string;
  category: string;
  status: "PENDING" | "ATTENDED";
  createdAt: string;
  resolvedAt?: string;
  latitude?: number;
  longitude?: number;
  media?: { type: "IMAGE" | "VIDEO"; url: string; key?: string }[];
  guard?: { 
      id: number;
      name: string; 
      lastName: string;
      username: string;
  };
  resolvedBy?: {
      id: number;
      name: string;
      lastName: string;
      username: string;
  };
}

export interface MaintenanceMediaItem {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  key?: string;
}

export interface CreateMaintenanceDto {
  title: string;
  categoryId: number;
  typeId: number;
  description: string;
  media: MaintenanceMediaItem[];
  latitude?: number;
  longitude?: number;
}

export const getPaginatedMaintenances = async (params: Record<string, unknown>): Promise<{ data: Maintenance[], total: number }> => {
    const res = await post<any>('/maintenance/datatable', params);
    if (res.success && res.data) {
        return {
            data: res.data.rows || [],
            total: res.data.total || 0,
        };
    }
    return { data: [], total: 0 };
};

export const getMaintenances = async (filters?: {
    startDate?: Date;
    endDate?: Date;
    guardId?: number;
    category?: string;
    title?: string;
}): Promise<TResult<Maintenance[]>> => {
    let query = '/maintenance?';
    const params = [];
    if (filters?.startDate) params.push(`startDate=${filters.startDate.toISOString()}`);
    if (filters?.endDate) params.push(`endDate=${filters.endDate.toISOString()}`);
    if (filters?.guardId) params.push(`guardId=${filters.guardId}`);
    if (filters?.category) params.push(`category=${filters.category}`);
    if (filters?.title) params.push(`title=${filters.title}`);
    
    if (params.length > 0) {
        query += params.join('&');
    } else {
        query = '/maintenance';
    }

    return await get<Maintenance[]>(query);
};

export const createMaintenance = async (data: CreateMaintenanceDto): Promise<TResult<Maintenance>> => {
    return await post<Maintenance>('/maintenance', data);
};

export const resolveMaintenance = async (id: number, userId?: number): Promise<TResult<Maintenance>> => {
    return await put<Maintenance>(`/maintenance/${id}/resolve`, { userId });
};

export const deleteMaintenance = async (id: number): Promise<TResult<boolean>> => {
    return await remove<boolean>(`/maintenance/${id}`);
};

export const deleteMaintenanceMedia = async (maintenanceId: number, key: string): Promise<TResult<boolean>> => {
    return await remove<boolean>(`/maintenance/${maintenanceId}/media?key=${key}`);
};

export const uploadMaintenanceFile = async (file: File): Promise<MaintenanceMediaItem | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("location", "maintenance");

    const res = await post<{ url: string; type: string; key: string }>("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });

    if (res.success && res.data?.url) {
        return {
            url: res.data.url,
            type: (res.data.type === 'VIDEO' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
            key: res.data.key,
        };
    }
    return null;
};

export interface MaintenancePdfFilters {
    startDate: Date;
    endDate: Date;
    ids?: number[];
    includeImages?: boolean;
    includeLocation?: boolean;
}

/**
 * Solicita al backend el PDF de mantenimientos filtrados por rango y,
 * opcionalmente, por IDs seleccionados. La respuesta se descarga
 * automáticamente en el navegador.
 */
export const downloadMaintenancesPdf = async (filters: MaintenancePdfFilters): Promise<TResult<boolean>> => {
    const params: string[] = [
        `startDate=${filters.startDate.toISOString()}`,
        `endDate=${filters.endDate.toISOString()}`,
        `includeImages=${filters.includeImages === false ? "false" : "true"}`,
        `includeLocation=${filters.includeLocation === false ? "false" : "true"}`,
    ];
    if (filters.ids && filters.ids.length > 0) {
        params.push(`ids=${filters.ids.join(",")}`);
    }

    const url = `/maintenance/report/pdf?${params.join("&")}`;

    try {
        const { axiosInstance } = await import("@app/core/axios/axios");
        const response = await axiosInstance.get(url, {
            responseType: "blob",
            headers: { Accept: "application/pdf" },
        });

        const blob = response.data as Blob;
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        const filename = `reporte-mantenimientos-${new Date().toISOString().slice(0, 10)}.pdf`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { data: true, success: true, message: "ok", messages: [], ex: null };
    } catch (error: unknown) {
        const e = error as { response?: { data?: Blob }; message?: string };
        let serverMessage = "Error al generar el PDF";
        if (e.response?.data instanceof Blob) {
            try {
                const text = await e.response.data.text();
                const parsed = JSON.parse(text) as { messages?: string[] };
                if (parsed.messages && parsed.messages.length > 0) {
                    serverMessage = parsed.messages.join(", ");
                }
            } catch {
                serverMessage = e.message ?? serverMessage;
            }
        } else if (e.message) {
            serverMessage = e.message;
        }

        return { data: false, success: false, message: serverMessage, messages: [serverMessage], ex: null };
    }
};
