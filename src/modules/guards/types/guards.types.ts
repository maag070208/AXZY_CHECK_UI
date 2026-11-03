import { User } from "../../users/services/UserService";

// Un guardia usa los campos de User; si necesita campos propios, se agregan aquí.
export type Guard = User;

export enum AssignmentStatus {
    PENDING = "PENDING",
    CHECKING = "CHECKING",
    UNDER_REVIEW = "UNDER_REVIEW",
    REVIEWED = "REVIEWED",
    COMPLETED = "COMPLETED",
    ANOMALY = "ANOMALY",
    CANCELLED = "CANCELLED"
}

export interface AssignmentTask {
    id?: number;
    description: string;
    reqPhoto: boolean;
    completed: boolean;
    completedAt?: string | null;
}

export interface Assignment {
    id: number;
    guardId: number;
    locationId: number;
    assignedBy: number;
    notes?: string;
    status: AssignmentStatus;
    createdAt: string;
    updatedAt: string;
    location: any;
    guard: Partial<User>;
    tasks: AssignmentTask[];
    kardex?: any[];
}

export interface CreateAssignmentDTO {
    guardId: number;
    locationId: number;
    assignedBy: number;
    notes?: string;
    tasks?: { description: string; reqPhoto: boolean }[];
}

/** Asignación de un guardia a un cliente (fase 3). Una abierta = `endsAt` null. */
export interface GuardAssignment {
    id: number;
    guardId: number;
    clientId: number;
    startsAt?: string;
    endsAt?: string | null;
    guard?: { id: number; name: string; lastName?: string; username?: string };
    client?: { id: number; name: string; type?: string };
}

export interface CreateGuardAssignmentDTO {
    guardId: number;
    clientId: number;
    startsAt?: string;
}
