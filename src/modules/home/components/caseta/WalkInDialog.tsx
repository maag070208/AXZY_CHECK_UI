import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInput, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { getPaginatedProperties, Property } from "@app/modules/properties/service/properties.service";
import { createWalkInVisit, Invitation } from "@modules/invitations/services/invitations.service";
import { invitationTypeLabel } from "@modules/invitations/invitation-type-label";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (invitation: Invitation) => void;
};

/**
 * Visita sin cita: la caseta registra a quien llega sin pase. Si el tipo lo exige, el residente de la casa
 * debe autorizarla; los repartidores pasan directo.
 */
export const WalkInDialog = ({ isOpen, onClose, onCreated }: Props) => {
  const dispatch = useDispatch();
  const { data: types } = useCatalog("invitation_type");
  const [properties, setProperties] = useState<{ label: string; value: string }[]>([]);
  const [guestName, setGuestName] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [plate, setPlate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // La lista de personal: el guardia no tiene `properties.view`, que además abre el padrón de cada casa.
    getPaginatedProperties({ page: 1, limit: 1000, filters: {} } as never).then((res) => {
      setProperties(res.data.map((p: Property) => ({ label: `${p.identifier} - ${p.name}`, value: String(p.id) })));
    });
  }, [isOpen]);

  const reset = () => {
    setGuestName("");
    setPropertyId("");
    setTypeId("");
    setPlate("");
    setError(null);
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (!guestName.trim() || !propertyId || !typeId) {
      setError("Completa el nombre, la casa y el tipo de visita.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await createWalkInVisit({
      guestName: guestName.trim(),
      propertyId: Number(propertyId),
      typeId: Number(typeId),
      expectedPlate: plate.trim() || undefined,
    });
    setSaving(false);
    if (res.success && res.data) {
      const waiting = res.data.status === "PENDING_APPROVAL";
      dispatch(showToast({
        message: waiting ? "Visita registrada. Esperando autorización del residente." : "Visita registrada. Ya puede pasar.",
        type: "success",
      }));
      onCreated(res.data);
      reset();
      onClose();
    } else {
      setError(res.messages?.[0] ?? "No se pudo registrar la visita");
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={close} title="Visita sin cita" className="max-w-md">
      <ITFlex direction="column" gap={4} className="p-1">
        <ITText as="p" className="text-xs text-slate-500">
          Para quien llega sin pase. Si el tipo lo requiere, el residente de la casa debe autorizarla antes de la entrada.
        </ITText>

        {error && <ITAlert variant="error">{error}</ITAlert>}

        <ITInput
          name="walk-in-name"
          label="Nombre de quien llega"
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          maxLength={120}
          autoFocus
        />

        <ITSearchSelect
          label="Casa que visita"
          name="walk-in-property"
          value={propertyId}
          onChange={(value) => setPropertyId(String(value))}
          options={[{ label: "Seleccionar casa...", value: "" }, ...properties]}
        />

        <ITSearchSelect
          label="Tipo de visita"
          name="walk-in-type"
          value={typeId}
          onChange={(value) => setTypeId(String(value))}
          options={[
            { label: "Seleccionar tipo...", value: "" },
            ...types.map((t) => ({ label: invitationTypeLabel({ name: t.name, value: t.value }), value: String(t.id) })),
          ]}
        />

        <ITInput
          name="walk-in-plate"
          label="Placa (opcional)"
          value={plate}
          onChange={(event) => setPlate(String(event.target.value).toUpperCase())}
          maxLength={12}
        />

        <ITFlex justify="end" gap={2}>
          <ITButton variant="text" color="gray" onClick={close} disabled={saving}>Cancelar</ITButton>
          <ITButton onClick={submit} disabled={saving}>{saving ? "Registrando…" : "Registrar visita"}</ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
