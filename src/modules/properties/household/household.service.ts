import { get, post } from "@app/core/axios/axios";

export interface HouseholdResident {
  id: number;
  isPrimary: boolean;
  canAuthorizeVisits: boolean;
  hasAppAccess: boolean;
  person: { id: number; firstName: string; lastName?: string | null; phone?: string | null; birthDate?: string | null; userId?: number | null };
  kind: { code: string; name: string; isHouseholdMember: boolean };
}

export interface ResidentKindOption {
  code: string;
  name: string;
  isHouseholdMember: boolean;
  canAuthorizeVisits: boolean;
  hasAppAccess: boolean;
}

type Result<T> = { success?: boolean; code?: string; messages?: string[]; data?: T };
/** El cliente HTTP lanza el cuerpo de respuestas no 2xx: se devuelve tal cual para leer success y code. */
const settle = <T>(request: Promise<T>): Promise<T> => request.catch((error) => error as T);

export const listHousehold = (propertyId: number) => get<HouseholdResident[]>(`/properties/${propertyId}/residents`);
export const listResidentKinds = () => get<ResidentKindOption[]>("/residents/kinds");

export const addHouseholdResident = (
  propertyId: number,
  body: { firstName: string; lastName?: string | null; phone?: string | null; kindCode: string; confirmNewPerson?: boolean },
) => settle(post<HouseholdResident>(`/properties/${propertyId}/residents`, body)) as Promise<Result<HouseholdResident>>;

export const setPrimaryResident = (residentId: number) =>
  settle(post<unknown>(`/residents/${residentId}/primary`, {})) as Promise<Result<unknown>>;

export const moveOutResident = (residentId: number) =>
  settle(post<{ warning: string | null }>(`/residents/${residentId}/move-out`, {})) as Promise<Result<{ warning: string | null }>>;
