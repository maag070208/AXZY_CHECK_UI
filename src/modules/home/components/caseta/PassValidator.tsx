import { useState } from "react";
import { ITAlert, ITButton, ITChip, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaHome, FaQrcode, FaSearch, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { getInvitationByCode, Invitation } from "@modules/invitations/services/invitations.service";
import { invitationTypeLabel } from "@modules/invitations/invitation-type-label";
import { visitWindow, type VisitAction } from "./visit.utils";

const STATUS_LABEL: Record<Invitation["status"], { label: string; color: "success" | "warning" | "gray" | "danger" | "info" }> = {
  PENDING: { label: "Por llegar", color: "warning" },
  ENTERED: { label: "Dentro", color: "success" },
  EXITED: { label: "Ya salió", color: "gray" },
  EXPIRED: { label: "Vencido", color: "danger" },
  CANCELLED: { label: "Revocado", color: "danger" },
};

type Props = {
  onAction: (invitation: Invitation, action: VisitAction) => void;
  /** Cambia tras cada registro para limpiar el resultado. */
  resetKey: number;
};

/**
 * Validación de pases en caseta. Funciona con lector QR USB (teclea el código y Enter) o escribiéndolo a mano.
 */
export const PassValidator = ({ onAction, resetKey }: Props) => {
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReset, setLastReset] = useState(resetKey);

  if (lastReset !== resetKey) {
    setLastReset(resetKey);
    setResult(null);
    setCode("");
  }

  const search = async () => {
    const value = code.trim();
    if (!value) return;
    setSearching(true);
    setError(null);
    setResult(null);
    const res = await getInvitationByCode(value);
    setSearching(false);
    if (res.success && res.data) setResult(res.data);
    else setError("No encontramos un pase con ese código. Revísalo con la visita.");
  };

  const now = dayjs();
  const outsideWindow = result && (now.isBefore(result.validFrom) || now.isAfter(result.validUntil));
  const status = result ? STATUS_LABEL[result.status] : null;

  return (
    <ITFlex direction="column" gap={3}>
      <ITFlex align="end" gap={2}>
        <ITInput
          name="pass-code"
          label="Código del pase"
          placeholder="Escanea el QR o escribe el código (AXZ-…)"
          value={code}
          onChange={(event) => setCode(String(event.target.value).toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") search();
          }}
          iconLeft={<FaQrcode />}
          maxLength={40}
          autoFocus
          containerClassName="flex-1"
        />
        <ITButton onClick={search} disabled={!code.trim() || searching} ariaLabel="Buscar pase">
          <ITFlex align="center" gap={2}><FaSearch size={12} /> {searching ? "Buscando…" : "Buscar"}</ITFlex>
        </ITButton>
      </ITFlex>

      {error && <ITAlert variant="warning">{error}</ITAlert>}

      {result && status && (
        <ITFlex direction="column" gap={3} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <ITFlex align="start" justify="between" gap={3} wrap="wrap">
            <ITFlex direction="column" gap={1} className="min-w-0">
              <ITText as="span" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{result.code}</ITText>
              <ITText as="p" className="truncate text-lg font-black text-slate-900">{result.guestName}</ITText>
              <ITFlex align="center" gap={2} wrap="wrap" className="text-xs text-slate-600">
                <ITFlex align="center" gap={1} className="font-semibold"><FaHome size={11} /> {result.property?.identifier ?? result.property?.name}</ITFlex>
                {result.type && <ITChip size="sm" variant="outlined" color="gray" label={invitationTypeLabel(result.type)} />}
                <ITText as="span" className="text-xs text-slate-500">{visitWindow(result)}</ITText>
              </ITFlex>
            </ITFlex>
            <ITChip color={status.color} label={status.label} />
          </ITFlex>

          {result.status === "PENDING" && outsideWindow && (
            <ITAlert variant="warning">El pase no está vigente en este horario. No se puede registrar la entrada.</ITAlert>
          )}

          <ITFlex gap={2} wrap="wrap">
            {result.status === "PENDING" && (
              <ITButton disabled={!!outsideWindow} onClick={() => onAction(result, "ENTERED")}>
                <ITFlex align="center" gap={2}><FaSignInAlt size={12} /> Registrar entrada</ITFlex>
              </ITButton>
            )}
            {result.status === "ENTERED" && (
              <ITButton color="secondary" onClick={() => onAction(result, "EXITED")}>
                <ITFlex align="center" gap={2}><FaSignOutAlt size={12} /> Registrar salida</ITFlex>
              </ITButton>
            )}
            <ITButton variant="text" color="gray" onClick={() => { setResult(null); setCode(""); }}>Limpiar</ITButton>
          </ITFlex>
        </ITFlex>
      )}
    </ITFlex>
  );
};
