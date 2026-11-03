import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance, get, patch, post, put, remove } from "@app/core/axios/axios";
import { setAuth } from "@app/core/store/auth/auth.slice";
import store from "@app/core/store/store";
import { setClients, tenantLoading } from "@app/core/store/tenant/tenant.slice";
import { tenantStorageKey } from "@app/core/store/tenant/tenant.storage";
import { makeToken } from "../../helpers/render";
import { API, server } from "../../helpers/server";

beforeEach(() => {
  store.dispatch({ type: "auth/logout" });
  window.location.hash = "";
});

describe("axios wrappers", () => {
  it.each([
    ["get", () => get("/x"), "GET"],
    ["post", () => post("/x", { a: 1 }), "POST"],
    ["patch", () => patch("/x", { a: 1 }), "PATCH"],
    ["put", () => put("/x", { a: 1 }), "PUT"],
    ["remove", () => remove("/x"), "DELETE"],
  ] as const)("%s devuelve el cuerpo de la respuesta", async (_n, call, method) => {
    let seen = "";
    server.use(
      http.all(`${API}/x`, ({ request }) => {
        seen = request.method;
        return HttpResponse.json({ success: true, data: 42 });
      }),
    );
    await expect(call()).resolves.toEqual({ success: true, data: 42 });
    expect(seen).toBe(method);
  });

  it.each([
    ["get", () => get("/x")],
    ["post", () => post("/x", {})],
    ["patch", () => patch("/x", {})],
    ["put", () => put("/x", {})],
    ["remove", () => remove("/x")],
  ] as const)("%s lanza el cuerpo del error del API", async (_n, call) => {
    server.use(http.all(`${API}/x`, () => HttpResponse.json({ success: false, message: "mal" }, { status: 400 })));
    await expect(call()).rejects.toEqual({ success: false, message: "mal" });
  });

  it("agrega el Bearer token cuando hay sesión", async () => {
    store.dispatch(setAuth(makeToken()));
    let auth: string | null = null;
    server.use(
      http.get(`${API}/x`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ success: true });
      }),
    );
    await get("/x");
    expect(auth).toBe(`Bearer ${store.getState().auth.token}`);
  });

  it("sin sesión no manda Authorization", async () => {
    let auth: string | null = "x";
    server.use(
      http.get(`${API}/x`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ success: true });
      }),
    );
    await get("/x");
    expect(auth).toBeNull();
  });

  it("un 401 cierra la sesión y manda a /login", async () => {
    store.dispatch(setAuth(makeToken()));
    server.use(http.get(`${API}/x`, () => HttpResponse.json({ message: "no" }, { status: 401 })));
    await expect(get("/x")).rejects.toBeTruthy();
    expect(store.getState().auth.token).toBeNull();
    expect(window.location.hash).toBe("#/login");
  });

  it("un 401 estando ya en /login no reasigna el hash", async () => {
    window.location.hash = "#/login";
    server.use(http.get(`${API}/x`, () => HttpResponse.json({ message: "no" }, { status: 401 })));
    await expect(get("/x")).rejects.toBeTruthy();
    expect(window.location.hash).toBe("#/login");
  });

  it("el interceptor de request rechazado oculta el loader", async () => {
    const handlers = (axiosInstance.interceptors.request as any).handlers;
    const rejected = handlers.find((h: any) => h?.rejected).rejected;
    store.dispatch({ type: "loader/showLoader" });
    await expect(rejected(new Error("x"))).rejects.toThrow("x");
    expect(store.getState().loader.loading).toBe(false);
  });
});

describe("baseURL", () => {
  it("usa VITE_BASE_URL y cae a localhost:4444 si no está definida", async () => {
    expect(axiosInstance.defaults.baseURL).toBe("http://api.test/api/v1");
    vi.stubEnv("VITE_BASE_URL", "");
    vi.resetModules();
    const fresh = await import("@app/core/axios/axios");
    expect(fresh.axiosInstance.defaults.baseURL).toBe("http://localhost:4444/api/v1");
    vi.unstubAllEnvs();
  });
});

describe("X-Client-Id (fase 3)", () => {
  const clients = [
    { id: 7, name: "Plaza Centro", type: "PLAZA" as const, active: true },
    { id: 9, name: "Maquila Norte", type: "MAQUILA" as const, active: true },
  ];

  const captureHeader = async () => {
    let seen: string | null | undefined;
    server.use(
      http.get(`${API}/x`, ({ request }) => {
        seen = request.headers.get("x-client-id");
        return HttpResponse.json({ success: true });
      }),
    );
    await get("/x");
    return seen;
  };

  it("ADMIN manda el cliente elegido en X-Client-Id", async () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    store.dispatch(setClients({ clients, userId: 1, storedClientId: 9 }));
    await expect(captureHeader()).resolves.toBe("9");
  });

  it("MAINT también elige cliente y lo manda", async () => {
    store.dispatch(setAuth(makeToken({ role: "MAINT" })));
    store.dispatch(setClients({ clients, userId: 1, storedClientId: 7 }));
    await expect(captureHeader()).resolves.toBe("7");
  });

  it("usa la selección persistida durante el arranque, antes de cargar el slice", async () => {
    localStorage.setItem(tenantStorageKey(1), "9");
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    expect(store.getState().tenant.selectedClientId).toBeNull();
    await expect(captureHeader()).resolves.toBe("9");
  });

  it.each(["GUARD", "SHIFT", "RESDN", "CLIENT"])("%s nunca manda X-Client-Id", async (role) => {
    store.dispatch(setAuth(makeToken({ role })));
    // Aunque el slice tenga una selección (p. ej. heredada en el navegador), el
    // encabezado solo aplica a ADMIN/MAINT: a los demás el API les daría 403.
    store.dispatch(setClients({ clients, userId: 1, storedClientId: 7 }));
    await expect(captureHeader()).resolves.toBeNull();
  });

  it("ADMIN sin selección ni persistencia no manda el encabezado", async () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    store.dispatch(tenantLoading(1));
    await expect(captureHeader()).resolves.toBeNull();
  });
});
