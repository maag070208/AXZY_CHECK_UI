import { ITButton, ITFlex, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { FaBuilding, FaRedo } from "react-icons/fa";
import type { Client } from "@app/core/types/client.types";
import type { TenantStatus } from "@app/core/store/tenant/tenant.slice";
import { CLIENT_TYPE_LABELS } from "../clients.constants";

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: number | null;
  status: TenantStatus;
  onSelect: (clientId: number) => void;
  onRetry: () => void;
}

/**
 * Selector global de cliente del encabezado (solo ADMIN/MAINT). Al cambiar se
 * actualiza el slice de tenant, se limpian las tablas y la vista se remonta con
 * el nuevo `X-Client-Id` (ver `useTenantBootstrap`).
 */
export const ClientSelector = ({ clients, selectedClientId, status, onSelect, onRetry }: ClientSelectorProps) => {
  const options = clients
    .filter((client) => client.active !== false || client.id === selectedClientId)
    .map((client) => ({
      value: client.id,
      label:
        client.active === false
          ? `${client.name} (${CLIENT_TYPE_LABELS[client.type] ?? client.type}, inactivo)`
          : `${client.name} (${CLIENT_TYPE_LABELS[client.type] ?? client.type})`,
    }));

  return (
    <ITFlex
      align="center"
      gap={3}
      className="sticky top-0 z-30 -mx-8 mb-2 flex-wrap border-b border-slate-200 bg-white/95 px-8 py-3 backdrop-blur"
    >
      <ITFlex align="center" justify="center" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <FaBuilding size={14} />
      </ITFlex>
      <ITFlex direction="column" className="min-w-0">
        <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Cliente activo
        </ITText>
        <ITText as="p" className="text-[11px] font-medium text-slate-500">
          Los datos y el menú se filtran por el cliente elegido.
        </ITText>
      </ITFlex>

      <ITFlex align="center" gap={2} className="ml-auto w-full sm:w-[340px]">
        {status === "error" ? (
          <>
            <ITText as="p" className="text-xs font-medium text-rose-600">
              No se pudieron cargar los clientes.
            </ITText>
            <ITButton onClick={onRetry} variant="outlined" color="secondary" size="sm" icon={<FaRedo size={11} />}>
              Reintentar
            </ITButton>
          </>
        ) : status === "loading" ? (
          <ITText as="p" className="text-xs font-medium text-slate-400">
            Cargando clientes…
          </ITText>
        ) : options.length === 0 ? (
          <ITText as="p" className="text-xs font-medium text-slate-400">
            Sin clientes disponibles.
          </ITText>
        ) : (
          <ITSearchSelect
            name="clientSelector"
            label="Cliente"
            placeholder="Selecciona un cliente..."
            options={options}
            value={selectedClientId ?? ""}
            onChange={(value) => onSelect(Number(value))}
            clearable={false}
            size="md"
            className="w-full"
          />
        )}
      </ITFlex>
    </ITFlex>
  );
};
