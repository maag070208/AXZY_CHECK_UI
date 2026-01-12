import { get, post, put } from "@app/core/axios/axios";

export interface VehiclePhoto {
  id: number;
  category: string;
  imageUrl: string;
}

export interface VehicleEntry {
  id: number;
  entryNumber: string;
  userId: number;
  operatorUserId: number;
  locationId: number;
  entryDate: string;
  status: 'ACTIVE' | 'MOVED' | 'EXITED' | 'CANCELLED';
  brand: string;
  model: string;
  color: string;
  plates: string;
  mileage?: number;
  notes?: string;
  location?: { name: string };
  user?: { name: string; lastName: string };
  operator?: { name: string; lastName: string };
  photos?: VehiclePhoto[];
  assignments?: { 
      id: number; 
      status: string; 
      type: string; 
      createdAt: string;
      operator?: { name: string; lastName: string };
      targetLocation?: { name: string };
  }[];
}

export const getEntries = async () => {
  return await get<VehicleEntry[]>("/entries");
};

export const getEntryById = async (id: number) => {
  return await get<VehicleEntry>(`/entries/${id}`);
};

export const getLastUserEntry = async (userId: number) => {
    return await get<VehicleEntry>(`/entries/user/${userId}/latest`);
};

export const getUserVehicles = async (userId: number) => {
    return await get<VehicleEntry[]>(`/entries/user/${userId}/vehicles`);
};

export const createEntry = async (formData: FormData) => {
  // Axios automatically sets Content-Type to multipart/form-data when data is FormData
  return await post<VehicleEntry>("/entries", formData, {
  });
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  // Returns { success: true, data: { url: "/uploads/..." } }
  return await post<{ url: string }>("/uploads", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const assignKey = async (entryId: number, operatorId: number, type: string, targetLocationId?: number) => {
  return await post("/key-assignments", { entryId, operatorId, type, targetLocationId });
};

export const finishKeyAssignment = async (assignmentId: number) => {
    return await put(`/key-assignments/${assignmentId}/finish`, {});
};
export interface KeyAssignment {
    id: number;
    entryId: number;
    operatorUserId: number;
    type: "MOVEMENT" | "DELIVERY";
    status: "ACTIVE" | "COMPLETED";
    startedAt: string;
    endedAt?: string;
    entry?: VehicleEntry;
    operator?: { name: string; lastName: string };
    targetLocation?: { aisle: string; spot: string; name: string };
}

export const getKeyAssignments = async () => {
    return await get<KeyAssignment[]>("/key-assignments");
};
