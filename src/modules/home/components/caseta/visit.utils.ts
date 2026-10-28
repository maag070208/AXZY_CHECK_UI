import dayjs from "dayjs";
import type { Invitation } from "@modules/invitations/services/invitations.service";

export type VisitAction = "ENTERED" | "EXITED";

/** Ventana del pase en texto corto: "10:00 – 18:00" si es el mismo día. */
export const visitWindow = (inv: Invitation) => {
  const from = dayjs(inv.validFrom);
  const until = dayjs(inv.validUntil);
  return from.isSame(until, "day")
    ? `${from.format("DD MMM · HH:mm")} – ${until.format("HH:mm")}`
    : `${from.format("DD MMM HH:mm")} – ${until.format("DD MMM HH:mm")}`;
};
