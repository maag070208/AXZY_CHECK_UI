/** Cliente (sitio) de una organización: residencial, plaza o maquila. */
export type ClientType = "RESIDENTIAL" | "MAQUILA" | "PLAZA";

export interface Client {
  id: number;
  name: string;
  type: ClientType;
  active: boolean;
  organizationId?: number;
}
