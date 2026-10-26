import { get, post } from "@app/core/axios/axios";

export type AnnouncementAudience = "ALL" | "PROPERTY" | "ROLE";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  propertyId: number | null;
  property?: { id: number; identifier: string; name: string } | null;
  roleName: string | null;
  sentAt: string;
  recipients: number;
  readCount: number;
  createdBy?: { id: number; name: string; lastName: string | null } | null;
}

const errorOf = (error: any, fallback: string) => new Error(error?.messages?.[0] ?? fallback);

export const getAnnouncements = async (params: { page: number; pageSize: number }) => {
  try {
    const res = await get<{ items: Announcement[]; total: number }>("/announcements", { params });
    if (!res.success || !res.data) throw new Error("No se pudieron cargar los avisos");
    return res.data;
  } catch (error) {
    throw errorOf(error, "No se pudieron cargar los avisos");
  }
};

export const createAnnouncement = async (input: {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  propertyId?: number;
  roleName?: string;
}) => {
  try {
    const res = await post<Announcement>("/announcements", input);
    if (!res.success || !res.data) throw new Error("No se pudo enviar el aviso");
    return res.data;
  } catch (error) {
    throw errorOf(error, "No se pudo enviar el aviso");
  }
};
