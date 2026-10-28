const INVITATION_TYPE_LABELS: Record<string, string> = {
  VISITOR: "Visita",
  VISITA: "Visita",
  PROVIDER: "Proveedor",
  PROVEEDOR: "Proveedor",
  SERVICE: "Servicio",
  SERVICIO: "Servicio",
  DELIVERY: "Entrega",
  ENTREGA: "Entrega",
};

/** Traduce el nombre técnico del catálogo (VISITOR) a la etiqueta visible (Visita). */
export const invitationTypeLabel = (type?: { name?: string | null; value?: string | null } | null): string => {
  const raw = (type?.name ?? type?.value ?? "").trim();
  const key = raw.toUpperCase();
  return INVITATION_TYPE_LABELS[key] ?? type?.value ?? (raw || "Visita");
};
