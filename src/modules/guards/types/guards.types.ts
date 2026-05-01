import { User } from "../../users/services/UserService";

export interface Guard extends User {
  // Guard specific fields if any, otherwise it uses User fields
}

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
