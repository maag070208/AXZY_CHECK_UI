import dayjs from "dayjs";
import type { Invitation } from "@modules/invitations/services/invitations.service";

/** Acciones de caseta sobre una visita: registrar movimientos, o decidir sobre una visita sin cita. */
export type VisitAction = "ENTERED" | "EXITED" | "APPROVE" | "REJECT";

/** Minutos que la caseta espera la respuesta del residente antes de marcarla como escalable al jefe. */
export const APPROVAL_TIMEOUT_MINUTES = 10;

/** Ventana del pase en texto corto: "10:00 – 18:00" si es el mismo día. */
export const visitWindow = (inv: Invitation) => {
  const from = dayjs(inv.validFrom);
  const until = dayjs(inv.validUntil);
  return from.isSame(until, "day")
    ? `${from.format("DD MMM · HH:mm")} – ${until.format("HH:mm")}`
    : `${from.format("DD MMM HH:mm")} – ${until.format("DD MMM HH:mm")}`;
};
