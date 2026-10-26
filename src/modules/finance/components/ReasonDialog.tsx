import {
  ITAlert,
  ITButton,
  ITDialog,
  ITFlex,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<void>;
}

export const ReasonDialog = ({ isOpen, onClose, title, message, confirmLabel, onConfirm }: Props) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setReason("");
    setError(null);
  }, [isOpen]);

  const submit = async () => {
    if (reason.trim().length < 3) {
      setError("Escribe el motivo (mínimo 3 caracteres).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={title} className="w-[520px] max-w-[95vw]">
      <ITFlex direction="column" gap={3} className="p-2">
        <ITText as="p" className="text-sm text-slate-600">{message}</ITText>
        {error && <ITAlert variant="error" title="No se pudo completar">{error}</ITAlert>}
        <ITTextarea
          name="reason"
          label="Motivo"
          rows={3}
          value={reason}
          onChange={(value) => setReason(value)}
          maxLength={500}
          placeholder="Explica el motivo. Quedará registrado en el historial."
        />
        <ITFlex justify="end" gap={2}>
          <ITButton label="Cancelar" variant="outlined" onClick={onClose} disabled={saving} />
          <ITButton label={saving ? "Guardando..." : confirmLabel} color="danger" onClick={submit} disabled={saving} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
