import { describe, expect, it } from "vitest";
import authReducer, { isAuthenticated, logout, setAuth, setSession, setSessionScope } from "@app/core/store/auth/auth.slice";
import loaderReducer, { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import toastReducer, { hideToast, showToast } from "@app/core/store/toast/toast.slice";
import tableReducer, {
  clearAllTableStates,
  clearTableState,
  getTableStateByKey,
  hasTableState,
  saveTableState,
} from "@app/core/store/tables/tables.slice";
import { makeToken } from "../../helpers/render";

describe("auth.slice", () => {
  const empty = {
    id: null,
    name: null,
    email: null,
    role: null,
    photoUrl: null,
    token: null,
    session: false,
    permissions: null,
    clientId: null,
    organizationId: null,
  };

  it("setAuth con token válido guarda los datos del JWT", () => {
    const token = makeToken({ id: 7, name: "Ana", role: "GUARD" });
    const s = authReducer(undefined, setAuth(token));
    expect(s).toEqual({
      id: 7,
      name: "Ana",
      email: "admin@check.app",
      role: "GUARD",
      photoUrl: null,
      token,
      session: true,
      permissions: null,
      clientId: null,
      organizationId: null,
    });
    expect(isAuthenticated({ auth: s })).toBe(true);
  });

  it("usa valores por defecto cuando el JWT trae pocos datos", () => {
    const s = authReducer(undefined, setAuth(makeToken({ id: undefined, name: undefined, email: undefined, role: undefined })));
    expect(s).toMatchObject({ id: null, name: "Usuario", email: null, role: null });
  });

  it("token expirado o inválido deja la sesión vacía", () => {
    const logged = authReducer(undefined, setAuth(makeToken()));
    expect(authReducer(logged, setAuth(makeToken({ exp: 1 })))).toEqual(empty);
    expect(authReducer(logged, setAuth("basura"))).toEqual(empty);
    expect(isAuthenticated({ auth: empty })).toBe(false);
  });

  it("logout limpia la sesión", () => {
    expect(authReducer(authReducer(undefined, setAuth(makeToken())), logout())).toEqual(empty);
  });

  it("setSession guarda el alcance fijo (clientId/organizationId) de /users/me", () => {
    const s = authReducer(
      undefined,
      setSession({ id: 5, name: "Gaby", email: "g@check.app", role: "GUARD", clientId: 7, organizationId: 3 }),
    );
    expect(s).toMatchObject({
      id: 5,
      role: "GUARD",
      clientId: 7,
      organizationId: 3,
      token: null,
      session: true,
    });
  });

  it("setSession sin alcance deja clientId/organizationId en null", () => {
    const s = authReducer(undefined, setSession({ id: 5, role: "MAINT" }));
    expect(s).toMatchObject({ clientId: null, organizationId: null });
  });

  it("setSessionScope completa el alcance de un login con token", () => {
    const logged = authReducer(undefined, setAuth(makeToken({ id: 8, role: "CLIENT" })));
    expect(logged.clientId).toBeNull();
    const scoped = authReducer(logged, setSessionScope({ clientId: 9, organizationId: 2 }));
    expect(scoped).toMatchObject({ clientId: 9, organizationId: 2, role: "CLIENT" });
    // Solo actualiza las claves enviadas.
    expect(authReducer(scoped, setSessionScope({ clientId: 4 }))).toMatchObject({
      clientId: 4,
      organizationId: 2,
    });
  });

  it("un login nuevo resetea el alcance anterior y logout también lo limpia", () => {
    const scoped = authReducer(undefined, setSession({ id: 5, role: "GUARD", clientId: 7, organizationId: 3 }));
    expect(authReducer(scoped, setAuth(makeToken({ id: 9, role: "ADMIN" })))).toMatchObject({
      clientId: null,
      organizationId: null,
    });
    expect(authReducer(scoped, logout())).toMatchObject({ clientId: null, organizationId: null });
  });
});

describe("loader.slice", () => {
  it("alterna loading", () => {
    const on = loaderReducer(undefined, showLoader());
    expect(on.loading).toBe(true);
    expect(loaderReducer(on, hideLoader()).loading).toBe(false);
  });
});

describe("toast.slice", () => {
  it("showToast aplica valores por defecto de duración y posición", () => {
    const s = toastReducer(undefined, showToast({ message: "Hola", type: "success" }));
    expect(s).toMatchObject({ message: "Hola", type: "success", duration: 1500, position: "top-right", isVisible: true });
  });

  it("respeta duración y posición indicadas y hideToast lo oculta", () => {
    const s = toastReducer(
      undefined,
      showToast({ message: "x", type: "error", duration: 5000, position: "bottom-left" }),
    );
    expect(s).toMatchObject({ duration: 5000, position: "bottom-left" });
    expect(toastReducer(s, hideToast()).isVisible).toBe(false);
  });
});

describe("tables.slice", () => {
  const item = { tableKey: "users", pageIndex: 2, pageSize: 10, sort: "asc" as const };

  it("guarda un estado nuevo y lo actualiza si la clave ya existe", () => {
    let s = tableReducer(undefined, saveTableState(item));
    expect(s.hasTableState).toBe(true);
    s = tableReducer(s, saveTableState({ ...item, pageIndex: 5, filterValue: "a" }));
    expect(s.tableState).toHaveLength(1);
    expect(s.tableState[0]).toMatchObject({ pageIndex: 5, filterValue: "a" });
  });

  it("selectores: hasTableState y getTableStateByKey", () => {
    const s = tableReducer(undefined, saveTableState(item));
    expect(hasTableState({ table: s })).toBe(true);
    expect(getTableStateByKey({ table: s })("users")?.pageIndex).toBe(2);
    expect(getTableStateByKey({ table: s })("otra")).toBeUndefined();
  });

  it("clearTableState conserva hasTableState mientras queden tablas", () => {
    let s = tableReducer(undefined, saveTableState(item));
    s = tableReducer(s, saveTableState({ ...item, tableKey: "roles" }));
    s = tableReducer(s, clearTableState("users"));
    expect(s.hasTableState).toBe(true);
    s = tableReducer(s, clearTableState("roles"));
    expect(s.hasTableState).toBe(false);
  });

  it("clearAllTableStates vacía todo", () => {
    const s = tableReducer(tableReducer(undefined, saveTableState(item)), clearAllTableStates());
    expect(s).toEqual({ hasTableState: false, tableState: [] });
  });
});
