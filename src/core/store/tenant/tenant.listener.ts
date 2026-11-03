import { createListenerMiddleware } from "@reduxjs/toolkit";
import { logout } from "../auth/auth.slice";
import { clearTenant, selectClient, setClients, TenantState } from "./tenant.slice";
import { clearPersistedClientSelection, persistClientSelection } from "./tenant.storage";

/**
 * Sincroniza la selección de cliente con localStorage sin ensuciar los
 * reducers (que se mantienen puros) y la borra al cerrar sesión, incluso si el
 * cierre lo provoca el interceptor de axios (401).
 */
export const tenantListenerMiddleware = createListenerMiddleware();

const tenantOf = (state: unknown): TenantState | undefined =>
  (state as { tenant?: TenantState } | undefined)?.tenant;

const persistSelection = (state: unknown) => {
  const tenant = tenantOf(state);
  if (!tenant || tenant.userId === null) return;
  if (tenant.selectedClientId === null) {
    clearPersistedClientSelection(tenant.userId);
  } else {
    persistClientSelection(tenant.userId, tenant.selectedClientId);
  }
};

tenantListenerMiddleware.startListening({
  actionCreator: setClients,
  effect: (_action, api) => persistSelection(api.getState()),
});

tenantListenerMiddleware.startListening({
  actionCreator: selectClient,
  effect: (_action, api) => persistSelection(api.getState()),
});

tenantListenerMiddleware.startListening({
  actionCreator: logout,
  effect: (_action, api) => {
    const tenant = tenantOf(api.getOriginalState());
    if (tenant?.userId !== null && tenant?.userId !== undefined) {
      clearPersistedClientSelection(tenant.userId);
    }
    api.dispatch(clearTenant());
  },
});
