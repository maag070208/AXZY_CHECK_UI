import type { ClientType } from "@app/core/types/client.types";

/** Etiquetas de UI para los tipos de cliente del API. */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  RESIDENTIAL: "Residencial",
  MAQUILA: "Maquila",
  PLAZA: "Plaza",
};

export const CLIENT_TYPE_OPTIONS: { label: string; value: ClientType }[] = (
  Object.keys(CLIENT_TYPE_LABELS) as ClientType[]
).map((type) => ({ label: CLIENT_TYPE_LABELS[type], value: type }));
