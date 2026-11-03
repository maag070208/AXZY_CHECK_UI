import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { AppDispatch, AppState } from "@app/core/store/store";
import { clearAllTableStates } from "@app/core/store/tables/tables.slice";
import { getClients } from "@modules/clients/clients.service";
import {
  selectedClientId as selectedClientIdSelector,
  selectClient as selectClientAction,
  setClients,
  tenantClients as tenantClientsSelector,
  tenantError,
  tenantLoading,
  tenantStatus as tenantStatusSelector,
  TenantStatus,
} from "./tenant.slice";
import { readPersistedClientSelection } from "./tenant.storage";
import type { Client } from "@app/core/types/client.types";

export interface TenantBootstrap {
  /** ADMIN/MAINT eligen cliente; el resto de roles tiene el alcance fijado en el token. */
  canSelectClients: boolean;
  clients: Client[];
  selectedClientId: number | null;
  status: TenantStatus;
  /** Cambia el cliente activo: persiste la elección, limpia tablas y remonta la vista. */
  selectClient: (clientId: number) => void;
  /** Reintenta la carga de clientes tras un error. */
  reload: () => void;
}

/**
 * Carga una sola vez por sesión los clientes de la organización y administra la
 * selección global. Se monta en `PrivateRoutes` (debajo de la sesión).
 *
 * Decisión de recarga al cambiar de cliente: en lugar de rastrear qué pantalla
 * está abierta y pedirle que se refresque, `PrivateRoutes` remonta el contenido
 * con `key={selectedClientId}`. Es la forma más simple y robusta de garantizar
 * que ninguna tabla conserve filas del cliente anterior.
 */
export const useTenantBootstrap = (): TenantBootstrap => {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<AppState>();
  const role = useSelector((state: AppState) => state.auth.role);
  const userId = useSelector((state: AppState) => state.auth.id);
  const clients = useSelector(tenantClientsSelector);
  const selected = useSelector(selectedClientIdSelector);
  const status = useSelector(tenantStatusSelector);

  const canSelectClients = (role === "ADMIN" || role === "MAINT") && userId !== null;
  const requestedFor = useRef<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!canSelectClients || userId === null) return;
    // Uno por sesión (y uno por reintento manual): evita el doble GET de StrictMode.
    if (requestedFor.current === userId) return;
    requestedFor.current = userId;
    // Se lee antes de cualquier otra petición: la pantalla montada puede
    // resolver su propio `GET /clients` primero y limpiar el slice.
    const storedClientId = readPersistedClientSelection(userId);
    dispatch(tenantLoading(userId));

    getClients()
      .then((res) => {
        const stillSameUser = requestedFor.current === userId && store.getState().auth.id === userId;
        if (!stillSameUser) return;
        if (res.success && Array.isArray(res.data)) {
          dispatch(
            setClients({
              clients: res.data,
              userId,
              storedClientId,
            }),
          );
        } else {
          dispatch(tenantError());
        }
      })
      .catch(() => {
        if (requestedFor.current === userId && store.getState().auth.id === userId) {
          dispatch(tenantError());
        }
      });
  }, [canSelectClients, userId, attempt, dispatch, store]);

  const changeClient = useCallback(
    (clientId: number) => {
      dispatch(selectClientAction(clientId));
      // El estado de tablas (página, filtros, selección) no debe cruzar de cliente.
      dispatch(clearAllTableStates());
    },
    [dispatch],
  );

  const reload = useCallback(() => {
    requestedFor.current = null;
    setAttempt((current) => current + 1);
  }, []);

  return { canSelectClients, clients, selectedClientId: selected, status, selectClient: changeClient, reload };
};
