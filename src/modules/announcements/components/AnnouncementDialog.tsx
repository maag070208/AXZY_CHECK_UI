import { ITAlert, ITButton, ITDialog, ITFlex, ITGrid, ITInput, ITSearchSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
import { AnnouncementAudience, createAnnouncement } from "../services/announcements.service";

interface OptionProperty {
  id: number;
  identifier: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
  properties: OptionProperty[];
}

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
  { value: "ALL", label: "Todos los residentes" },
  { value: "PROPERTY", label: "Una propiedad" },
  { value: "ROLE", label: "Un rol" },
];

const ROLE_OPTIONS = [
  { value: "RESDN", label: "Residentes" },
  { value: "GUARD", label: "Guardias" },
  { value: "SHIFT", label: "Jefes de guardias" },
  { value: "MAINT", label: "Mantenimiento" },
];

export const AnnouncementDialog = ({ isOpen, onClose, onSent, properties }: Props) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("ALL");
  const [propertyId, setPropertyId] = useState("");
  const [roleName, setRoleName] = useState("RESDN");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setBody("");
    setAudience("ALL");
    setPropertyId("");
    setRoleName("RESDN");
    setError(null);
  }, [isOpen]);

  const propertyOptions = useMemo(
    () => properties.map((property) => ({ value: String(property.id), label: `${property.identifier} · ${property.name}` })),
    [properties],
  );

  const submit = async () => {
    setError(null);
    if (title.trim().length < 3) return setError("Escribe un título de al menos 3 caracteres.");
    if (body.trim().length < 3) return setError("Escribe el mensaje del aviso.");
    if (audience === "PROPERTY" && !propertyId) return setError("Elige la propiedad destinataria.");
    setSending(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
        ...(audience === "PROPERTY" ? { propertyId: Number(propertyId) } : {}),
        ...(audience === "ROLE" ? { roleName } : {}),
      });
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el aviso.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Nuevo aviso" className="w-[680px] max-w-[95vw]">
      <ITFlex direction="column" gap={3} className="p-2">
        <ITText as="p" className="text-xs text-slate-500">
          El aviso llega a la bandeja de la APP de los residentes y queda con acuse de lectura.
        </ITText>
        {error && <ITAlert variant="error" title="Revisa el aviso">{error}</ITAlert>}

        <ITInput name="title" label="Título" placeholder="Ej. Corte de agua programado" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
        <ITTextarea name="body" label="Mensaje" placeholder="Escribe el comunicado…" value={body} onChange={(value) => setBody(value)} maxLength={2000} rows={5} />

        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={audience === "ALL" ? 12 : 4}>
            <ITSearchSelect name="audience" label="Destinatarios" options={AUDIENCE_OPTIONS} value={audience} onChange={(value) => setAudience(String(value) as AnnouncementAudience)} clearable={false} required />
          </ITGrid>
          {audience === "PROPERTY" && (
            <ITGrid item xs={12} md={8}>
              <ITSearchSelect name="propertyId" label="Propiedad" placeholder="Busca una propiedad…" options={propertyOptions} value={propertyId} onChange={(value) => setPropertyId(String(value))} clearable={false} required />
            </ITGrid>
          )}
          {audience === "ROLE" && (
            <ITGrid item xs={12} md={8}>
              <ITSearchSelect name="roleName" label="Rol" options={ROLE_OPTIONS} value={roleName} onChange={(value) => setRoleName(String(value))} clearable={false} required />
            </ITGrid>
          )}
        </ITGrid>

        <ITFlex justify="end" gap={2}>
          <ITButton label="Cancelar" variant="outlined" onClick={onClose} disabled={sending} />
          <ITButton label={sending ? "Enviando…" : "Enviar aviso"} onClick={() => void submit()} disabled={sending} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
