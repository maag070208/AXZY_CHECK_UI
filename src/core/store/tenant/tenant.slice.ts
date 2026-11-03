import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Client } from "@app/core/types/client.types";

export type TenantStatus = "idle" | "loading" | "ready" | "error";

export interface TenantState {
  /** Clientes de la organización que puede ver el usuario (ADMIN/MAINT). */
  clients: Client[];
  /** Cliente elegido en el selector global; `null` = sin selección. */
  selectedClientId: number | null;
  status: TenantStatus;
  /** Usuario dueño de los datos: evita mezclar sesiones distintas. */
  userId: number | null;
  /**
   * Generación de la selección. Solo cambia cuando el usuario elige cliente a
   * mano; `PrivateRoutes` la usa como `key` para remontar la vista actual y
   * recargar sus datos con el nuevo `X-Client-Id`.
   */
  selectionVersion: number;
}

const initialState: TenantState = {
  clients: [],
  selectedClientId: null,
  status: "idle",
  userId: null,
  selectionVersion: 0,
};

export interface SetClientsPayload {
  clients: Client[];
  userId: number;
  /** Selección persistida en el navegador, si la hay. */
  storedClientId?: number | null;
}

/**
 * Resuelve la selección al recibir la lista de clientes:
 * 1. conserva la selección actual si sigue existiendo;
 * 2. restaura la persistida en localStorage para ese usuario;
 * 3. si la organización solo tiene un cliente, lo selecciona (producto 1).
 * Con varios clientes y sin selección se queda en `null` y el selector pide elegir.
 */
const resolveSelection = (
  state: TenantState,
  clients: Client[],
  userId: number,
  storedClientId?: number | null,
): number | null => {
  const ids = new Set(clients.map((client) => client.id));
  const current = state.userId === userId ? state.selectedClientId : null;
  if (current !== null && ids.has(current)) return current;
  if (storedClientId !== null && storedClientId !== undefined && ids.has(storedClientId)) return storedClientId;
  if (clients.length === 1) return clients[0].id;
  return null;
};

const tenantSlice = createSlice({
  name: "tenant",
  initialState,
  selectors: {
    tenantClients: (state) => state.clients,
    selectedClientId: (state) => state.selectedClientId,
    tenantStatus: (state) => state.status,
    tenantUserId: (state) => state.userId,
  },
  reducers: {
    tenantLoading: (state, action: PayloadAction<number>) => {
      if (state.userId !== action.payload) {
        state.clients = [];
        state.selectedClientId = null;
      }
      state.userId = action.payload;
      state.status = "loading";
    },

    setClients: (state, action: PayloadAction<SetClientsPayload>) => {
      const { clients, userId, storedClientId } = action.payload;
      state.selectedClientId = resolveSelection(state, clients, userId, storedClientId);
      state.clients = clients;
      state.userId = userId;
      state.status = "ready";
    },

    tenantError: (state) => {
      state.status = "error";
    },

    selectClient: (state, action: PayloadAction<number | null>) => {
      state.selectedClientId = action.payload;
      state.selectionVersion += 1;
    },

    clearTenant: () => initialState,
  },
});

export default tenantSlice.reducer;

export const { tenantLoading, setClients, tenantError, selectClient, clearTenant } = tenantSlice.actions;
export const { tenantClients, selectedClientId, tenantStatus, tenantUserId } = tenantSlice.selectors;
