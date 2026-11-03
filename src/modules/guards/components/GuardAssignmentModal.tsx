import { ITButton, ITCard, ITDialog, ITFlex, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaBuilding } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { PersonAvatar } from "@app/core/components/PersonAvatar";
import type { Client } from "@app/core/types/client.types";
import { getClients } from "../../clients/clients.service";
import { CLIENT_TYPE_LABELS } from "../../clients/clients.constants";
import { createGuardAssignment } from "../service/guards.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: number;
  guardName: string;
  /** Cliente asignado actualmente, si lo hay (se reemplaza al guardar). */
  currentClientName?: string;
  onSuccess: () => void;
}

/**
 * Asigna un guardia de la plantilla a un cliente (`GET /clients` +
 * `POST /guard-assignments`). El API cierra automáticamente la asignación
 * abierta anterior, de modo que este mismo modal sirve para reasignar.
 */
export const GuardAssignmentModal = ({
  isOpen,
  onClose,
  guardId,
  guardName,
  currentClientName,
  onSuccess,
}: Props) => {
  const dispatch = useDispatch();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedClientId(undefined);
    setLoadingClients(true);
    getClients()
      .then((res) => {
        setClients(res.success && Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setClients([]))
      .finally(() => setLoadingClients(false));
  }, [isOpen]);

  const activeClients = clients.filter((client) => client.active !== false);
  const options = activeClients.map((client) => ({
    label: `${client.name} (${CLIENT_TYPE_LABELS[client.type] ?? client.type})`,
    value: client.id,
  }));

  const handleSubmit = async () => {
    if (selectedClientId === undefined || submitting) return;
    setSubmitting(true);
    try {
      const res = await createGuardAssignment({
        guardId,
        clientId: Number(selectedClientId),
      });
      if (res.success) {
        dispatch(showToast({ message: "Guardia asignado al cliente", type: "success" }));
        onSuccess();
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "Error al asignar el cliente", type: "error" }));
      }
    } catch (error: any) {
      const message = error?.messages?.[0] || error?.message || "Error al asignar el cliente";
      dispatch(showToast({ message, type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Asignar a cliente" className="w-[560px] max-w-[95vw]">
      <ITFlex direction="column" gap={4}>
        <ITCard className="rounded-2xl border-0! bg-emerald-50/60! shadow-none!" contentClassName="p-3!">
          <ITFlex align="center" gap={3}>
            <PersonAvatar name={guardName} size={44} />
            <ITFlex direction="column">
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70">
                Guardia
              </ITText>
              <ITText as="p" className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                {guardName}
              </ITText>
              <ITText as="p" className="text-[10px] text-emerald-700/70">
                {currentClientName ? `Actualmente en ${currentClientName}` : "Sin cliente asignado"}
              </ITText>
            </ITFlex>
          </ITFlex>
        </ITCard>

        <ITCard className="rounded-2xl border-0! bg-slate-50/70! shadow-none!" contentClassName="p-4!">
          <ITFlex align="center" gap={2} className="mb-3">
            <ITFlex
              align="center"
              justify="center"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 dark:bg-slate-800"
            >
              <FaBuilding size={12} />
            </ITFlex>
            <ITText as="p" className="text-xs font-black text-slate-800 dark:text-slate-100">
              Cliente
            </ITText>
          </ITFlex>
          {loadingClients ? (
            <ITText as="p" className="text-xs text-slate-400">
              Cargando clientes…
            </ITText>
          ) : options.length === 0 ? (
            <ITText as="p" className="text-xs text-slate-400">
              No hay clientes activos disponibles.
            </ITText>
          ) : (
            <ITSearchSelect
              placeholder="Selecciona el cliente..."
              options={options}
              value={selectedClientId}
              onChange={(value) => setSelectedClientId(value)}
              clearable={false}
              size="md"
            />
          )}
        </ITCard>

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" size="md" onClick={onClose}>
            Cancelar
          </ITButton>
          <ITButton
            color="primary"
            size="md"
            onClick={() => void handleSubmit()}
            disabled={selectedClientId === undefined || submitting}
          >
            {submitting ? "Asignando..." : "Asignar guardia"}
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
};
