import {
  ITBadget,
  ITButton,
  ITCard,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaBuilding, FaPlus, FaRedo, FaSync } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { setClients } from "@app/core/store/tenant/tenant.slice";
import { useCan } from "@app/core/permissions/useCan";
import { P } from "@app/core/permissions/permissions.constants";
import type { Client, ClientType } from "@app/core/types/client.types";
import { CLIENT_TYPE_LABELS, CLIENT_TYPE_OPTIONS } from "../clients.constants";
import { createClient, getClients, updateClient } from "../clients.service";

const messageOf = (error: unknown, fallback: string): string => {
  const payload = error as { message?: string; messages?: string[] } | undefined;
  return payload?.messages?.[0] || payload?.message || fallback;
};

/**
 * Pantalla de clientes de la organización (fase 3). Lista con `GET /clients`,
 * crea con `POST /clients` y activa/desactiva con `PATCH /clients/:id`.
 * Ver la pantalla exige `client.view`; las acciones de escritura, `client.manage`.
 */
const ClientsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const can = useCan();
  const userId = useSelector((state: AppState) => state.auth.id);
  const tenantSelectedClientId = useSelector((state: AppState) => state.tenant.selectedClientId);
  const canManage = can(P.CLIENT_MANAGE);

  const [clients, setLocalClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ClientType>("RESIDENTIAL");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getClients();
      if (res.success && Array.isArray(res.data)) {
        setLocalClients(res.data);
        // Mantiene el selector global en sincronía tras crear o desactivar.
        if (userId !== null) dispatch(setClients({ clients: res.data, userId }));
      } else {
        setLoadError(res.messages?.[0] || "No se pudieron cargar los clientes");
      }
    } catch (error: unknown) {
      setLoadError(messageOf(error, "No se pudieron cargar los clientes"));
    } finally {
      setLoading(false);
    }
  }, [dispatch, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const closeCreate = () => {
    setIsCreateOpen(false);
    setName("");
    setType("RESIDENTIAL");
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;
    setSaving(true);
    try {
      const res = await createClient({ name: trimmedName, type });
      if (res.success) {
        dispatch(showToast({ message: "Cliente creado correctamente", type: "success" }));
        closeCreate();
        await load();
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "Error al crear el cliente", type: "error" }));
      }
    } catch (error: unknown) {
      dispatch(showToast({ message: messageOf(error, "Error al crear el cliente"), type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (client: Client) => {
    if (updatingId !== null) return;
    setUpdatingId(client.id);
    try {
      const res = await updateClient(client.id, { active: !client.active });
      if (res.success) {
        dispatch(
          showToast({
            message: client.active ? "Cliente desactivado correctamente" : "Cliente activado correctamente",
            type: "success",
          }),
        );
        await load();
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar el cliente", type: "error" }));
      }
    } catch (error: unknown) {
      dispatch(showToast({ message: messageOf(error, "Error al actualizar el cliente"), type: "error" }));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ITPage
      className="m-0! mx-auto! max-w-[1200px]! px-6! bg-slate-50 mb-8"
      noPadding
      title="Clientes"
      breadcrumbs={[{ label: "Inicio", href: "#/home" }, { label: "Organización" }, { label: "Clientes" }]}
      description="Sitios donde la organización presta el servicio: residenciales, plazas y maquilas."
      icon={<FaBuilding size={20} />}
      actions={
        canManage ? (
          <ITButton onClick={() => setIsCreateOpen(true)} color="primary" size="md">
            <ITFlex align="center" gap={2}>
              Nuevo cliente
              <FaPlus />
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      <ITFlex direction="column" gap={4} className="w-full pb-10 pt-5">
        <ITCard className="rounded-3xl" contentClassName="p-4!">
          <ITFlex align="center" justify="between" gap={3} className="flex-wrap">
            <ITFlex direction="column">
              <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Clientes de la organización
              </ITText>
              <ITText as="p" className="text-xs text-slate-500">
                {clients.length} {clients.length === 1 ? "cliente registrado" : "clientes registrados"}
              </ITText>
            </ITFlex>
            <ITButton
              onClick={() => void load()}
              variant="icon-only"
              color="secondary"
              size="md"
              icon={<FaSync />}
              ariaLabel="Actualizar clientes"
              title="Actualizar clientes"
            />
          </ITFlex>
        </ITCard>

        {loading ? (
          <ITCard className="rounded-3xl" contentClassName="p-6!">
            <ITText as="p" className="text-sm text-slate-500">
              Cargando clientes…
            </ITText>
          </ITCard>
        ) : loadError ? (
          <ITCard className="rounded-3xl" contentClassName="p-6!">
            <ITFlex align="center" justify="between" gap={3} className="flex-wrap">
              <ITText as="p" role="alert" className="text-sm font-medium text-rose-600">
                {loadError}
              </ITText>
              <ITButton onClick={() => void load()} variant="outlined" color="secondary" size="sm" icon={<FaRedo size={11} />}>
                Reintentar
              </ITButton>
            </ITFlex>
          </ITCard>
        ) : clients.length === 0 ? (
          <ITCard className="rounded-3xl" contentClassName="p-8!">
            <ITFlex direction="column" align="center" gap={2} className="text-center">
              <ITText as="p" className="text-sm font-bold text-slate-600">
                Aún no hay clientes registrados
              </ITText>
              <ITText as="p" className="text-xs text-slate-400">
                Crea el primer cliente para empezar a asignarle guardias.
              </ITText>
            </ITFlex>
          </ITCard>
        ) : (
          <ITFlex direction="column" gap={2}>
            {clients.map((client) => (
              <ITCard key={client.id} className="rounded-2xl" contentClassName="p-4!">
                <ITFlex align="center" gap={3} className="flex-wrap">
                  <ITFlex
                    align="center"
                    justify="center"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                  >
                    <FaBuilding size={14} />
                  </ITFlex>
                  <ITFlex direction="column" className="min-w-0 flex-1">
                    <ITFlex align="center" gap={2} className="flex-wrap">
                      <ITText as="p" className="text-sm font-bold text-slate-800">
                        {client.name}
                      </ITText>
                      {client.id === tenantSelectedClientId && (
                        <ITBadget color="success" variant="filled" size="sm">
                          Activo en el selector
                        </ITBadget>
                      )}
                    </ITFlex>
                    <ITText as="p" className="text-[11px] font-medium text-slate-500">
                      {CLIENT_TYPE_LABELS[client.type] ?? client.type}
                    </ITText>
                  </ITFlex>
                  <ITBadget color={client.active ? "success" : "secondary"} variant="filled" size="sm">
                    {client.active ? "Activo" : "Inactivo"}
                  </ITBadget>
                  {canManage && (
                    <ITButton
                      onClick={() => void handleToggleActive(client)}
                      variant="outlined"
                      color={client.active ? "danger" : "primary"}
                      size="sm"
                      disabled={updatingId === client.id}
                    >
                      {client.active ? "Desactivar" : "Activar"}
                    </ITButton>
                  )}
                </ITFlex>
              </ITCard>
            ))}
          </ITFlex>
        )}
      </ITFlex>

      <ITDialog isOpen={isCreateOpen} onClose={closeCreate} title="Nuevo cliente" className="w-[520px] max-w-[95vw]">
        <ITFlex direction="column" gap={4}>
          <ITInput
            name="clientName"
            label="Nombre"
            placeholder="Residencial Bosques..."
            value={name}
            onChange={(event) => setName(event.target.value)}
            size="md"
          />
          <ITFlex direction="column" gap={1}>
            <ITText as="p" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Tipo de cliente
            </ITText>
            <ITSearchSelect
              name="clientType"
              placeholder="Selecciona el tipo..."
              options={CLIENT_TYPE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              value={type}
              onChange={(value) => setType(String(value) as ClientType)}
              clearable={false}
              size="md"
            />
          </ITFlex>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" size="md" onClick={closeCreate}>
              Cancelar
            </ITButton>
            <ITButton color="primary" size="md" onClick={() => void handleCreate()} disabled={!name.trim() || saving}>
              {saving ? "Creando..." : "Crear cliente"}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
};

export default ClientsPage;
