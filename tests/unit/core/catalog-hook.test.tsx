import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCatalogCache,
  clearSpecificCatalogCache,
  getRenderOption,
  useCatalog,
} from "@app/core/hooks/catalog.hook";
import { API, server } from "../../helpers/server";

const items = [{ id: 1, name: "a", value: "Uno" }, { id: 2, name: "b", value: "Dos" }];
const reply = (key: string, body: unknown, status = 200) => {
  const hits = { n: 0 };
  server.use(http.get(`${API}/catalog/${key}`, () => ((hits.n += 1), HttpResponse.json(body as never, { status }))));
  return hits;
};

beforeEach(() => clearCatalogCache());

describe("useCatalog", () => {
  it("carga el catálogo", async () => {
    reply("role", { success: true, data: items });
    const { result } = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(result.current.data).toEqual(items));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("segundo uso viene de la caché sin pedir de nuevo", async () => {
    const hits = reply("role", { success: true, data: items });
    const first = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(first.result.current.data).toEqual(items));
    const second = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(second.result.current.data).toEqual(items));
    expect(hits.n).toBe(1);
  });

  it("peticiones simultáneas comparten una sola llamada", async () => {
    const hits = reply("guard", { success: true, data: items });
    const a = renderHook(() => useCatalog("guard"));
    const b = renderHook(() => useCatalog("guard"));
    await waitFor(() => expect(a.result.current.data).toEqual(items));
    await waitFor(() => expect(b.result.current.data).toEqual(items));
    expect(hits.n).toBe(1);
  });

  it("la petición compartida que falla deja error en quien esperaba", async () => {
    reply("property", { success: false, data: [] });
    const a = renderHook(() => useCatalog("property"));
    const b = renderHook(() => useCatalog("property"));
    await waitFor(() => expect(a.result.current.error).toBeTruthy());
    await waitFor(() => expect(b.result.current.error?.message).toMatch(/property/));
    expect(b.result.current.data).toEqual([]);
  });

  it("la petición compartida exitosa llena a quien esperaba", async () => {
    reply("property", { success: true, data: items });
    const a = renderHook(() => useCatalog("property"));
    const b = renderHook(() => useCatalog("property"));
    await waitFor(() => expect(a.result.current.data).toEqual(items));
    await waitFor(() => expect(b.result.current.data).toEqual(items));
  });

  it("respuesta sin éxito → data vacía, error y sin caché", async () => {
    const hits = reply("role", { success: false, data: [] });
    const { result } = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(result.current.error?.message).toBe("Failed to load role catalog"));
    expect(result.current.data).toEqual([]);
    reply("role", { success: true, data: items });
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.data).toEqual(items));
    expect(hits.n).toBe(1);
  });

  it("respuesta con data que no es arreglo cuenta como error", async () => {
    reply("role", { success: true, data: "no" });
    const { result } = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it("error de red → error y data vacía", async () => {
    server.use(http.get(`${API}/catalog/role`, () => HttpResponse.error()));
    const { result } = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toEqual([]);
  });

  it("refresh ignora la caché y vuelve a pedir", async () => {
    const hits = reply("role", { success: true, data: items });
    const { result } = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(result.current.data).toEqual(items));
    act(() => result.current.refresh());
    await waitFor(() => expect(hits.n).toBe(2));
  });

  it("clearSpecificCatalogCache solo limpia ese catálogo", async () => {
    const roleHits = reply("role", { success: true, data: items });
    const guardHits = reply("guard", { success: true, data: items });
    const role = renderHook(() => useCatalog("role"));
    const guard = renderHook(() => useCatalog("guard"));
    await waitFor(() => expect(role.result.current.data).toEqual(items));
    await waitFor(() => expect(guard.result.current.data).toEqual(items));
    clearSpecificCatalogCache("role");
    renderHook(() => useCatalog("role"));
    renderHook(() => useCatalog("guard"));
    await waitFor(() => expect(roleHits.n).toBe(2));
    expect(guardHits.n).toBe(1);
  });

  it("caché vencida (más de 5 min) se vuelve a pedir", async () => {
    const hits = reply("role", { success: true, data: items });
    const now = Date.now();
    const real = Date.now;
    const first = renderHook(() => useCatalog("role"));
    await waitFor(() => expect(first.result.current.data).toEqual(items));
    Date.now = () => now + 6 * 60 * 1000;
    try {
      renderHook(() => useCatalog("role"));
      await waitFor(() => expect(hits.n).toBe(2));
    } finally {
      Date.now = real;
    }
  });
});

describe("getRenderOption", () => {
  const catalog = [{ id: 1, name: "a", value: "Uno" }, { id: "2", name: "b", value: "" }];
  it("devuelve el value del ítem", () => {
    expect(getRenderOption({ catalog, row: { t: 1 }, identifier: "t" })).toBe("Uno");
    expect(getRenderOption({ catalog, row: { t: "1" }, identifier: "t" })).toBe("Uno");
  });
  it("null si no hay valor en la fila, no existe el ítem o el value es vacío", () => {
    expect(getRenderOption({ catalog, row: { t: 0 }, identifier: "t" })).toBeNull();
    expect(getRenderOption({ catalog, row: { t: 9 }, identifier: "t" })).toBeNull();
    expect(getRenderOption({ catalog, row: { t: 2 }, identifier: "t" })).toBeNull();
  });
});
