import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface ClubItem {
  id: number;
  title: string;
  description: string;
  categoryId?: number;
  typeId?: number;
  category?: { id: number; name: string; value: string };
  type?: { id: number; name: string; value: string };
  status: "PENDING" | "ATTENDED";
  createdAt: string;
  resolvedAt?: string;
  latitude?: number;
  longitude?: number;
  media?: ClubMediaItem[];
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

export interface ClubMediaItem {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  key?: string;
}

export interface CreateClubDto {
  title: string;
  categoryId: number;
  typeId: number;
  description: string;
  media: ClubMediaItem[];
  latitude?: number;
  longitude?: number;
}

export const getClubs = async (filters?: {
    startDate?: Date;
    endDate?: Date;
    guardId?: number;
    category?: string;
    title?: string;
}): Promise<TResult<ClubItem[]>> => {
    let query = '/club?';
    const params = [];
    if (filters?.startDate) params.push(`startDate=${filters.startDate.toISOString()}`);
    if (filters?.endDate) params.push(`endDate=${filters.endDate.toISOString()}`);
    if (filters?.guardId) params.push(`guardId=${filters.guardId}`);
    if (filters?.category) params.push(`category=${filters.category}`);
    if (filters?.title) params.push(`title=${filters.title}`);

    if (params.length > 0) {
        query += params.join('&');
    } else {
        query = '/club';
    }

    return await get<ClubItem[]>(query);
};

export const createClub = async (data: CreateClubDto): Promise<TResult<ClubItem>> => {
    return await post<ClubItem>('/club', data);
};

export const resolveClub = async (id: number): Promise<TResult<ClubItem>> => {
    return await put<ClubItem>(`/club/${id}/resolve`, {});
};

export const deleteClub = async (id: number): Promise<TResult<boolean>> => {
    return await remove<boolean>(`/club/${id}`);
};

export const deleteClubMedia = async (id: number, key: string): Promise<TResult<boolean>> => {
    return await remove<boolean>(`/club/${id}/media?key=${key}`);
};

export const getPaginatedClubs = async (params: any): Promise<{ data: ClubItem[], total: number }> => {
    const res = await post<any>('/club/datatable', params);
    if (res.success && res.data) {
        return {
            data: res.data.rows || [],
            total: res.data.total || 0,
        };
    }
    return { data: [], total: 0 };
};

export const uploadClubFile = async (file: File): Promise<ClubMediaItem | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("location", "incident");

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

export interface ClubPdfFilters {
    startDate: Date;
    endDate: Date;
    ids?: number[];
    includeImages?: boolean;
    includeLocation?: boolean;
}

/**
 * Solicita al backend el PDF de reportes de casa club filtrados por rango y,
 * opcionalmente, por IDs seleccionados. La respuesta se descarga automáticamente
 * en el navegador.
 */
export const downloadClubsPdf = async (filters: ClubPdfFilters): Promise<TResult<boolean>> => {
    const params: string[] = [
        `startDate=${filters.startDate.toISOString()}`,
        `endDate=${filters.endDate.toISOString()}`,
        `includeImages=${filters.includeImages === false ? "false" : "true"}`,
        `includeLocation=${filters.includeLocation === false ? "false" : "true"}`,
    ];
    if (filters.ids && filters.ids.length > 0) {
        params.push(`ids=${filters.ids.join(",")}`);
    }

    const url = `/reports/club/pdf?${params.join("&")}`;

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
        const filename = `reporte-casa-club-${new Date().toISOString().slice(0, 10)}.pdf`;
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
