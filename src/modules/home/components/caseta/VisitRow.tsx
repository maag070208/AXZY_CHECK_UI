import { ITButton, ITChip, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaHome, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import type { Invitation } from "@modules/invitations/services/invitations.service";
import { invitationTypeLabel } from "@modules/invitations/invitation-type-label";
import { APPROVAL_TIMEOUT_MINUTES, visitWindow, type VisitAction } from "./visit.utils";

/** Estado de llegada: ya puede entrar, o desde qué hora. */
const arrivalChip = (inv: Invitation) => {
  const from = dayjs(inv.validFrom);
  if (!from.isAfter(dayjs())) return <ITChip size="sm" color="success" label="Puede entrar" />;
  if (from.isSame(dayjs(), "day")) return <ITChip size="sm" color="warning" label={`Desde ${from.format("HH:mm")}`} />;
  return <ITChip size="sm" color="gray" label={from.format("DD MMM")} />;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** Permanencia dentro en "2 h 15 min" o "40 min". */
const stayLabel = (entryTime?: string) => {
  if (!entryTime) return null;
  const minutes = Math.max(0, dayjs().diff(dayjs(entryTime), "minute"));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
};

type Mode = "expected" | "inside" | "awaiting";

type Props = {
  invitation: Invitation;
  mode: Mode;
  onAction: (invitation: Invitation, action: VisitAction) => void;
  /** Dentro: ya rebasó la permanencia máxima o el horario de su pase. */
  overstayed?: boolean;
  /** Por autorizar: solo el jefe y el admin pueden decidir desde caseta. */
  canApprove?: boolean;
};

/** Fila de visita para la caseta: quién es, a qué casa va y la acción que toca. */
export const VisitRow = ({ invitation, mode, onAction, overstayed = false, canApprove = false }: Props) => {
  const canEnter = mode === "expected" && !dayjs(invitation.validFrom).isAfter(dayjs());
  const waitedMinutes = invitation.createdAt ? dayjs().diff(dayjs(invitation.createdAt), "minute") : 0;
  const escalate = mode === "awaiting" && waitedMinutes >= APPROVAL_TIMEOUT_MINUTES;

  const avatarTone = mode === "inside"
    ? overstayed ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
    : mode === "awaiting" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700";

  return (
    <ITText as="li" className="list-none">
      <ITFlex align="center" gap={3} className="rounded-2xl border border-slate-100 bg-white px-3 py-3 transition hover:border-slate-200 hover:shadow-sm">
        <ITFlex align="center" justify="center" className={`h-10 w-10 shrink-0 rounded-xl text-xs font-black ${avatarTone}`} aria-hidden="true">
          {initials(invitation.guestName) || "?"}
        </ITFlex>

        <ITFlex direction="column" className="min-w-0 flex-1">
          <ITFlex align="center" gap={2} className="min-w-0">
            <ITText as="span" className="truncate text-sm font-bold text-slate-900">{invitation.guestName}</ITText>
            {invitation.type && <ITChip size="sm" variant="outlined" color="gray" label={invitationTypeLabel(invitation.type)} />}
            {invitation.expectedPlate && (
              <ITChip size="sm" variant="outlined" color="gray" label={`Placa ${invitation.expectedPlate}`} />
            )}
          </ITFlex>
          <ITFlex align="center" gap={2} wrap="wrap" className="text-[11px] text-slate-500">
            <ITFlex align="center" gap={1} className="font-semibold text-slate-600">
              <FaHome size={10} aria-hidden="true" /> {invitation.property?.identifier ?? invitation.property?.name ?? "Sin casa"}
            </ITFlex>
            <ITText as="span" className="text-[11px] text-slate-400">·</ITText>
            <ITText as="span" className="text-[11px] text-slate-500">
              {mode === "inside" && invitation.entryTime
                ? `Entró ${dayjs(invitation.entryTime).format("HH:mm")} · lleva ${stayLabel(invitation.entryTime)}`
                : mode === "awaiting"
                  ? `Llegó hace ${waitedMinutes} min`
                  : visitWindow(invitation)}
            </ITText>
          </ITFlex>
        </ITFlex>

        {mode === "expected" && arrivalChip(invitation)}
        {mode === "inside" && overstayed && <ITChip size="sm" color="danger" label="Fuera de tiempo" />}
        {mode === "awaiting" && (
          escalate
            ? <ITChip size="sm" color="danger" label="Sin respuesta · escalar" />
            : <ITChip size="sm" color="warning" label="Esperando residente" />
        )}

        {mode === "awaiting" ? (
          canApprove && (
            <ITFlex align="center" gap={2}>
              <ITButton size="sm" variant="outlined" color="danger" onClick={() => onAction(invitation, "REJECT")} ariaLabel={`Rechazar a ${invitation.guestName}`}>
                Rechazar
              </ITButton>
              <ITButton size="sm" onClick={() => onAction(invitation, "APPROVE")} ariaLabel={`Autorizar a ${invitation.guestName}`}>
                Autorizar
              </ITButton>
            </ITFlex>
          )
        ) : (
          <ITButton
            size="sm"
            variant={mode === "inside" ? "outlined" : "filled"}
            color={mode === "inside" ? "secondary" : "primary"}
            disabled={mode === "expected" && !canEnter}
            onClick={() => onAction(invitation, mode === "inside" ? "EXITED" : "ENTERED")}
            ariaLabel={`${mode === "inside" ? "Registrar salida de" : "Registrar entrada de"} ${invitation.guestName}`}
          >
            <ITFlex align="center" gap={2}>
              {mode === "inside" ? <FaSignOutAlt size={11} /> : <FaSignInAlt size={11} />}
              {mode === "inside" ? "Salida" : "Entrada"}
            </ITFlex>
          </ITButton>
        )}
      </ITFlex>
    </ITText>
  );
};
