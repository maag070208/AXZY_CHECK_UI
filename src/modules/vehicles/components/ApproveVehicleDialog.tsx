import { ITAlert, ITButton, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { approveVehicle, VehicleRow } from "../services/vehicles.service";

export const ApproveVehicleDialog = ({ vehicle, isOpen, onClose, onApproved }: { vehicle: VehicleRow | null; isOpen: boolean; onClose: () => void; onApproved: () => void }) => {
  const [tag, setTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTag("");
    setError(null);
  }, [isOpen]);

  const submit = async () => {
    if (!vehicle) return;
    setSaving(true);
    setError(null);
    try {
      await approveVehicle(vehicle.id, tag.trim() || undefined);
      onApproved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aprobar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Aprobar vehículo" className="w-[520px] max-w-[95vw]">
      <ITFlex direction="column" gap={3} className="p-2">
        <ITText as="p" className="text-xs text-slate-500">
          {vehicle ? `${vehicle.plate} · ${vehicle.brand ?? "Sin marca"} ${vehicle.model ?? ""}` : ""}
        </ITText>
        {error && <ITAlert variant="error" title="No se pudo aprobar">{error}</ITAlert>}
        <ITInput
          name="tagCode"
          label="Tag (opcional)"
          placeholder="Ej. TAG-A1B2C3"
          value={tag}
          onChange={(event) => setTag(event.target.value)}
          maxLength={20}
        />
        <ITText as="p" className="text-[11px] text-slate-400">
          Si lo dejas vacío, el sistema genera un tag único. El tag se usa para buscar el vehículo en caseta.
        </ITText>
        <ITFlex justify="end" gap={2}>
          <ITButton label="Cancelar" variant="outlined" onClick={onClose} disabled={saving} />
          <ITButton label={saving ? "Aprobando…" : "Aprobar"} onClick={() => void submit()} disabled={saving} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
