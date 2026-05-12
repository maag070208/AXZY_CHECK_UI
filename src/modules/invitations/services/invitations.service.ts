import { post, put } from "@app/core/axios/axios";

export interface Invitation {
  id: string;
  code: string;
  guestName: string;
  propertyId: number;
  createdById: number;
  validFrom: string;
  validUntil: string;
  status: "PENDING" | "ENTERED" | "EXITED" | "EXPIRED" | "CANCELLED";
  typeId: number;
  type?: { id: string; name: string; value: string };
  notes?: string;
  entryTime?: string;
  exitTime?: string;
  property?: { id: string; identifier: string; name: string };
  createdBy?: { id: string; name: string; lastName: string };
}

export const getPaginatedInvitations = async (params: any) => {
  try {
    const result = await post<any>("/invitations/datatable", params);
    // Map to rows required by ITDataTable
    return { data: result.data.rows, total: result.data.total, success: true };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      messages: error.messages || ["Error fetching invitations data"],
    };
  }
};

export const createInvitation = async (data: any) => {
  try {
    const result = await post<any>("/invitations", data);
    return {
      success: result.success,
      data: result.data,
      messages: (result as any).error?.messages || "",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      messages: error.messages || ["Error creating invitation"],
    };
  }
};

export const updateInvitationStatus = async (id: string, status: string) => {
  try {
    const result = await put<any>(`/invitations/${id}/status`, { status });
    return {
      success: result.success,
      data: result.data,
      messages: (result as any).error?.messages || "",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      messages: error.messages || ["Error updating status"],
    };
  }
};
