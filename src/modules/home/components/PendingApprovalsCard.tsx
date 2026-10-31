import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ITAlert, ITButton, ITCard, ITChip, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { showToast } from "@app/core/store/toast/toast.slice";
import { decideApproval, getPendingApprovals, Invitation } from "@modules/invitations/services/invitations.service";
import { VisitRow } from "./caseta/VisitRow";
import type { VisitAction } from "./caseta/visit.utils";

const REFRESH_MS = 60_000;

/**
 * Visitas sin cita que esperan autorización. El residente decide sobre su casa; el jefe y el admin
 * pueden escalar cualquiera. Si no hay nada pendiente, no ocupa espacio.
 */
export const PendingApprovalsCard = () => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState<Invitation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Invitation | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await getPendingApprovals();
    if (res.success) {
      setRows(res.data);
      setError(null);
    } else {
      setError(res.messages?.[0] ?? "No se pudieron cargar las autorizaciones");
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const decide = async (invitation: Invitation, decision: "APPROVE" | "REJECT", why?: string) => {
    setBusy(true);
    const res = await decideApproval(invitation.id, decision, why);
    setBusy(false);
    if (res.success) {
      dispatch(showToast({
        message: decision === "APPROVE" ? `Visita autorizada: ${invitation.guestName}` : `Visita rechazada: ${invitation.guestName}`,
        type: "success",
      }));
      setRejecting(null);
      setReason("");
      load();
    } else {
      dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo registrar la decisión", type: "error" }));
    }
  };

  const onAction = (invitation: Invitation, action: VisitAction) => {
    if (action === "APPROVE") void decide(invitation, "APPROVE");
    if (action === "REJECT") setRejecting(invitation);
  };

  if (error) return <ITAlert variant="warning" className="mb-4">{error}</ITAlert>;
  if (rows === null || rows.length === 0) return null;

  const confirmReject = () => {
    if (!rejecting) return;
    if (reason.trim().length < 3) {
      dispatch(showToast({ message: "Escribe el motivo del rechazo", type: "warning" }));
      return;
    }
    void decide(rejecting, "REJECT", reason.trim());
  };

  return (
    <>
      <ITCard
        title="Visitas por autorizar"
        className="mb-6"
        contentClassName="p-5!"
        headerActions={<ITChip size="sm" color="primary" label={String(rows.length)} />}
      >
        <ITFlex direction="column" gap={3}>
          <ITText as="p" className="text-xs text-slate-500">
            Llegaron sin cita a la caseta. Autoriza o rechaza para que el guardia pueda registrar su entrada.
          </ITText>
          <ITText as="ul" className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Visitas sin cita por autorizar">
            {rows.map((invitation) => (
              <VisitRow key={invitation.id} invitation={invitation} mode="awaiting" canApprove onAction={onAction} />
            ))}
          </ITText>
        </ITFlex>
      </ITCard>

      <ITDialog isOpen={!!rejecting} onClose={() => !busy && setRejecting(null)} title="Rechazar visita" className="max-w-md">
        {rejecting && (
          <ITFlex direction="column" gap={4} className="p-1">
            <ITText as="p" className="text-sm text-slate-700">
              No se registrará la entrada de <strong>{rejecting.guestName}</strong>. El guardia verá el motivo.
            </ITText>
            <ITInput
              name="approval-reject-reason"
              label="Motivo del rechazo"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              autoFocus
            />
            <ITFlex justify="end" gap={2}>
              <ITButton variant="text" color="gray" onClick={() => setRejecting(null)} disabled={busy}>Cancelar</ITButton>
              <ITButton color="danger" onClick={confirmReject} disabled={busy}>{busy ? "Rechazando…" : "Rechazar"}</ITButton>
            </ITFlex>
          </ITFlex>
        )}
      </ITDialog>
    </>
  );
};
