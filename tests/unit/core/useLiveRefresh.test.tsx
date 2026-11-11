import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { logout, setAuth, setSessionScope } from "@app/core/store/auth/auth.slice";
import { selectClient, setClients } from "@app/core/store/tenant/tenant.slice";
import { useLiveRefresh } from "@app/modules/dashboard/hooks/useLiveRefresh";
import { ablyProbe } from "../../helpers/ably";
import { makeToken } from "../../helpers/render";

const CLIENTS = [
  { id: 5, name: "Plaza Centro", type: "PLAZA" as const, active: true },
  { id: 6, name: "Maquila Norte", type: "MAQUILA" as const, active: true },
];

const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
const mount = () => renderHook(() => useLiveRefresh(() => {}), { wrapper });

beforeEach(() => {
  store.dispatch(logout());
});

describe("useLiveRefresh · canal por cliente (fase 7)", () => {
  it("ADMIN usa el cliente elegido en el selector global", () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    store.dispatch(setClients({ clients: CLIENTS, userId: 1, storedClientId: 5 }));
    mount();

    expect(ablyProbe.channels).toContain("dashboard:live-ops:5");
    expect(ablyProbe.channels).not.toContain("dashboard:live-ops");
  });

  it("MAINT también usa el cliente del selector", () => {
    store.dispatch(setAuth(makeToken({ role: "MAINT" })));
    store.dispatch(setClients({ clients: CLIENTS, userId: 1, storedClientId: 6 }));
    mount();

    expect(ablyProbe.channels).toContain("dashboard:live-ops:6");
  });

  it.each([
    ["GUARD", 3],
    ["SHIFT", 4],
    ["RESDN", 8],
    ["CLIENT", 9],
  ])("%s usa su clientId fijo del auth slice", (role, clientId) => {
    store.dispatch(setAuth(makeToken({ role })));
    store.dispatch(setSessionScope({ clientId, organizationId: 1 }));
    mount();

    expect(ablyProbe.channels).toContain(`dashboard:live-ops:${clientId}`);
    expect(ablyProbe.channels).not.toContain("dashboard:live-ops");
  });

  it("sin cliente activo no abre Ably (sigue el polling/REST)", () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    // Organización multicliente sin selección guardada.
    store.dispatch(setClients({ clients: CLIENTS, userId: 1 }));
    mount();

    expect(store.getState().tenant.selectedClientId).toBeNull();
    expect(ablyProbe.options).toBeUndefined();
    expect(ablyProbe.channels).toEqual([]);
  });

  it("ADMIN se re-suscribe al cambiar de cliente y cierra la conexión anterior", async () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    store.dispatch(setClients({ clients: CLIENTS, userId: 1, storedClientId: 5 }));
    mount();
    expect(ablyProbe.channels).toContain("dashboard:live-ops:5");
    const closedBefore = ablyProbe.closed;

    act(() => {
      store.dispatch(selectClient(6));
    });

    await waitFor(() => expect(ablyProbe.channels).toContain("dashboard:live-ops:6"));
    expect(ablyProbe.closed).toBeGreaterThan(closedBefore);
  });

  it("el canal global anterior ya no se usa", () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    store.dispatch(setClients({ clients: CLIENTS, userId: 1, storedClientId: 5 }));
    mount();

    expect(ablyProbe.channels.every((channel) => channel.startsWith("dashboard:live-ops:"))).toBe(true);
  });
});
