import { describe, expect, it } from "vitest";
import { setAuth, logout } from "@app/core/store/auth/auth.slice";
import store from "@app/core/store/store";
import tenantReducer, {
  clearTenant,
  selectClient,
  setClients,
  tenantLoading,
  tenantError,
} from "@app/core/store/tenant/tenant.slice";
import {
  clearPersistedClientSelection,
  persistClientSelection,
  readPersistedClientSelection,
  tenantStorageKey,
} from "@app/core/store/tenant/tenant.storage";
import { makeToken } from "../../helpers/render";

const clients = [
  { id: 7, name: "Plaza Centro", type: "PLAZA" as const, active: true },
  { id: 9, name: "Maquila Norte", type: "MAQUILA" as const, active: true },
];

describe("tenant.slice · selección de cliente", () => {
  it("con un solo cliente lo selecciona automáticamente", () => {
    const state = tenantReducer(undefined, setClients({ clients: [clients[0]], userId: 1 }));
    expect(state).toMatchObject({ status: "ready", userId: 1, selectedClientId: 7 });
    expect(state.clients).toHaveLength(1);
  });

  it("con varios clientes sin selección ni persistencia queda vacío para que el usuario elija", () => {
    const state = tenantReducer(undefined, setClients({ clients, userId: 1 }));
    expect(state.selectedClientId).toBeNull();
    expect(state.status).toBe("ready");
  });

  it("restaura la selección persistida si sigue existiendo", () => {
    const state = tenantReducer(undefined, setClients({ clients, userId: 1, storedClientId: 9 }));
    expect(state.selectedClientId).toBe(9);
  });

  it("ignora una selección persistida de un cliente que ya no existe", () => {
    const state = tenantReducer(undefined, setClients({ clients, userId: 1, storedClientId: 404 }));
    expect(state.selectedClientId).toBeNull();
  });

  it("conserva la selección actual al refrescar la lista", () => {
    let state = tenantReducer(undefined, setClients({ clients, userId: 1, storedClientId: 7 }));
    state = tenantReducer(state, selectClient(9));
    state = tenantReducer(state, setClients({ clients, userId: 1, storedClientId: 7 }));
    expect(state.selectedClientId).toBe(9);
  });

  it("no reutiliza la selección de otro usuario", () => {
    let state = tenantReducer(undefined, setClients({ clients, userId: 1, storedClientId: 9 }));
    state = tenantReducer(state, setClients({ clients, userId: 2 }));
    expect(state.selectedClientId).toBeNull();
    expect(state.userId).toBe(2);
  });

  it("selectClient cambia el cliente y suma una generación (remonte de la vista)", () => {
    let state = tenantReducer(undefined, setClients({ clients, userId: 1, storedClientId: 7 }));
    const version = state.selectionVersion;
    state = tenantReducer(state, selectClient(9));
    expect(state.selectedClientId).toBe(9);
    expect(state.selectionVersion).toBe(version + 1);
  });

  it("tenantLoading, tenantError y clearTenant manejan el ciclo de carga", () => {
    let state = tenantReducer(undefined, tenantLoading(1));
    expect(state.status).toBe("loading");
    state = tenantReducer(state, tenantError());
    expect(state.status).toBe("error");
    state = tenantReducer(state, clearTenant());
    expect(state).toMatchObject({ clients: [], selectedClientId: null, status: "idle", userId: null });
  });

  it("tenantLoading de otro usuario descarta los clientes y la selección anteriores", () => {
    let state = tenantReducer(undefined, setClients({ clients, userId: 1, storedClientId: 9 }));
    state = tenantReducer(state, tenantLoading(2));
    expect(state.clients).toEqual([]);
    expect(state.selectedClientId).toBeNull();
    expect(state.userId).toBe(2);
  });
});

describe("tenant.storage", () => {
  it("lee la selección guardada por usuario", () => {
    persistClientSelection(1, 9);
    expect(readPersistedClientSelection(1)).toBe(9);
    expect(localStorage.getItem(tenantStorageKey(1))).toBe("9");
  });

  it("devuelve null sin usuario, sin clave o con basura", () => {
    expect(readPersistedClientSelection(null)).toBeNull();
    expect(readPersistedClientSelection(2)).toBeNull();
    localStorage.setItem(tenantStorageKey(3), "no-es-un-id");
    expect(readPersistedClientSelection(3)).toBeNull();
  });

  it("borra solo la clave del usuario indicado", () => {
    persistClientSelection(1, 7);
    persistClientSelection(2, 9);
    clearPersistedClientSelection(1);
    expect(readPersistedClientSelection(1)).toBeNull();
    expect(readPersistedClientSelection(2)).toBe(9);
  });
});

describe("tenant.listener · persistencia y cierre de sesión", () => {
  it("persiste la auto-selección y la elección manual", () => {
    store.dispatch(setAuth(makeToken({ id: 5, role: "ADMIN" })));
    store.dispatch(setClients({ clients: [clients[0]], userId: 5 }));
    expect(localStorage.getItem(tenantStorageKey(5))).toBe("7");

    store.dispatch(setClients({ clients, userId: 5, storedClientId: 7 }));
    store.dispatch(selectClient(9));
    expect(localStorage.getItem(tenantStorageKey(5))).toBe("9");
  });

  it("si la lista deja la selección vacía borra lo persistido", () => {
    store.dispatch(setAuth(makeToken({ id: 6, role: "ADMIN" })));
    store.dispatch(setClients({ clients, userId: 6, storedClientId: 7 }));
    expect(localStorage.getItem(tenantStorageKey(6))).toBe("7");
    // El cliente elegido desaparece de la organización y quedan varios: sin selección.
    store.dispatch(
      setClients({
        clients: [
          { id: 8, name: "Plaza Sur", type: "PLAZA", active: true },
          { id: 9, name: "Maquila Este", type: "MAQUILA", active: true },
        ],
        userId: 6,
      }),
    );
    expect(store.getState().tenant.selectedClientId).toBeNull();
    expect(localStorage.getItem(tenantStorageKey(6))).toBeNull();
  });

  it("logout limpia el tenant y la selección persistida", () => {
    store.dispatch(setAuth(makeToken({ id: 8, role: "ADMIN" })));
    store.dispatch(setClients({ clients, userId: 8, storedClientId: 9 }));
    expect(localStorage.getItem(tenantStorageKey(8))).toBe("9");

    store.dispatch(logout());

    expect(store.getState().tenant).toMatchObject({
      clients: [],
      selectedClientId: null,
      status: "idle",
      userId: null,
    });
    expect(localStorage.getItem(tenantStorageKey(8))).toBeNull();
  });
});
