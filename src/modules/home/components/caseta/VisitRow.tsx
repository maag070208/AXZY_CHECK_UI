import { ITButton, ITChip, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaHome, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import type { Invitation } from "@modules/invitations/services/invitations.service";
import { visitWindow, type VisitAction } from "./visit.utils";


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

type Props = {
  invitation: Invitation;
  mode: "expected" | "inside";
  onAction: (invitation: Invitation, action: VisitAction) => void;
};

/** Fila de visita para la caseta: quién es, a qué casa va y la acción que toca (entrada o salida). */
export const VisitRow = ({ invitation, mode, onAction }: Props) => {
  const canEnter = mode === "expected" && !dayjs(invitation.validFrom).isAfter(dayjs());
  return (
    <ITText as="li" className="list-none">
    <ITFlex align="center" gap={3} className="rounded-2xl border border-slate-100 bg-white px-3 py-3 transition hover:border-slate-200 hover:shadow-sm">
      <ITFlex
        align="center"
        justify="center"
        className={`h-10 w-10 shrink-0 rounded-xl text-xs font-black ${mode === "inside" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        aria-hidden="true"
      >
        {initials(invitation.guestName) || "?"}
      </ITFlex>

      <ITFlex direction="column" className="min-w-0 flex-1">
        <ITFlex align="center" gap={2} className="min-w-0">
          <ITText as="span" className="truncate text-sm font-bold text-slate-900">{invitation.guestName}</ITText>
          {invitation.type?.name && <ITChip size="sm" variant="outlined" color="gray" label={invitation.type.name} />}
        </ITFlex>
        <ITFlex align="center" gap={2} wrap="wrap" className="text-[11px] text-slate-500">
          <ITFlex align="center" gap={1} className="font-semibold text-slate-600">
            <FaHome size={10} aria-hidden="true" /> {invitation.property?.identifier ?? invitation.property?.name ?? "Sin casa"}
          </ITFlex>
          <ITText as="span" className="text-[11px] text-slate-400">·</ITText>
          <ITText as="span" className="text-[11px] text-slate-500">
            {mode === "inside" && invitation.entryTime
              ? `Entró ${dayjs(invitation.entryTime).format("HH:mm")} · hasta ${dayjs(invitation.validUntil).format("HH:mm")}`
              : visitWindow(invitation)}
          </ITText>
        </ITFlex>
      </ITFlex>

      {mode === "expected" && arrivalChip(invitation)}
      {mode === "inside" && dayjs(invitation.validUntil).isBefore(dayjs()) && <ITChip size="sm" color="danger" label="Pase vencido" />}

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
    </ITFlex>
    </ITText>
  );
};
