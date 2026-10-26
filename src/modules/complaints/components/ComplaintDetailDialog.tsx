import { ITAlert, ITButton, ITChip, ITDialog, ITFlex, ITSegmentedControl, ITSkeleton, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  addComplaintMessage,
  changeComplaintStatus,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  ComplaintDetail,
  ComplaintStatus,
  getComplaint,
  NEXT_COMPLAINT_STATUSES,
} from "../services/ComplaintService";

type Props = {
  complaintId: number;
  onClose: () => void;
  onChanged: () => void;
};

const ComplaintDetailDialog = ({ complaintId, onClose, onChanged }: Props) => {
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [replyMode, setReplyMode] = useState<"public" | "internal">("public");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setComplaint(await getComplaint(complaintId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la queja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  const send = async () => {
    if (!complaint || !reply.trim()) return;
    setBusy(true);
    try {
      await addComplaintMessage(complaint.id, reply.trim(), replyMode === "internal");
      setReply("");
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
    } finally {
      setBusy(false);
    }
  };

  const moveTo = async (status: ComplaintStatus) => {
    if (!complaint) return;
    setBusy(true);
    try {
      await changeComplaintStatus(complaint.id, status);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen onClose={onClose} title={complaint?.title ?? "Queja"} padded>
      {loading && <ITSkeleton count={4} />}

      {error && <ITAlert variant="error" title="Error">{error}</ITAlert>}

      {complaint && (
        <ITFlex direction="column" gap={4}>
          <ITFlex gap={2} wrap="wrap" align="center">
            <ITChip label={COMPLAINT_STATUS_LABELS[complaint.status]} />
            <ITChip label={COMPLAINT_CATEGORY_LABELS[complaint.category]} />
            <ITText muted>{dayjs(complaint.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
          </ITFlex>

          <ITText>{complaint.description}</ITText>

          {complaint.media && complaint.media.length > 0 && (
            <ITFlex gap={2} wrap="wrap">
              {complaint.media.map((photo, index) => (
                <ITButton
                  key={photo.key}
                  variant="outline"
                  label={`Foto ${index + 1}`}
                  ariaLabel={`Abrir foto ${index + 1}`}
                  onClick={() => window.open(photo.url, "_blank", "noopener,noreferrer")}
                />
              ))}
            </ITFlex>
          )}

          <ITFlex direction="column" gap={3}>
            {complaint.messages.length === 0 && <ITText muted>Aún no hay mensajes.</ITText>}
            {complaint.messages.map((message) => (
              <ITFlex key={message.id} direction="column" gap={1}>
                <ITFlex gap={2} align="center">
                  {message.internal && <ITChip label="Nota interna" />}
                  <ITText muted>{dayjs(message.createdAt).format("DD/MM/YYYY HH:mm")}</ITText>
                </ITFlex>
                <ITText>{message.body}</ITText>
              </ITFlex>
            ))}
          </ITFlex>

          <ITFlex direction="column" gap={2}>
            <ITSegmentedControl
              options={[
                { value: "public", label: "Responder al residente" },
                { value: "internal", label: "Nota interna" },
              ]}
              value={replyMode}
              onChange={(value) => setReplyMode(value as "public" | "internal")}
            />
            <ITTextarea value={reply} onChange={setReply} rows={3} placeholder="Escribe un mensaje" maxLength={2000} />
            <ITFlex justify="end">
              <ITButton label="Enviar" disabled={busy || !reply.trim()} onClick={send} />
            </ITFlex>
          </ITFlex>

          {NEXT_COMPLAINT_STATUSES[complaint.status].length > 0 && (
            <ITFlex gap={2} wrap="wrap" justify="end">
              {NEXT_COMPLAINT_STATUSES[complaint.status].map((status) => (
                <ITButton
                  key={status}
                  variant="outline"
                  label={`Marcar: ${COMPLAINT_STATUS_LABELS[status]}`}
                  disabled={busy}
                  onClick={() => moveTo(status)}
                />
              ))}
            </ITFlex>
          )}
        </ITFlex>
      )}
    </ITDialog>
  );
};

export default ComplaintDetailDialog;
