import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { getCatalogBusinessLineServiceOptions, getCatalogOptions } from "@app/core/services/CatalogService";
import { fetchDataTable } from "@app/core/services/table-fetcher.service";
import { API, server } from "../../helpers/server";

describe("CatalogService", () => {
  it("getCatalogOptions pide /catalog/:key", async () => {
    server.use(http.get(`${API}/catalog/roles`, () => HttpResponse.json({ success: true, data: [1] })));
    expect(await getCatalogOptions("roles" as never)).toEqual({ success: true, data: [1] });
  });

  it("getCatalogOptions devuelve respuesta vacía si falla", async () => {
    server.use(http.get(`${API}/catalog/roles`, () => HttpResponse.json({ messages: ["boom"] }, { status: 500 })));
    expect(await getCatalogOptions("roles" as never)).toEqual({ success: false, data: [], messages: ["boom"] });
  });

  it("getCatalogOptions usa mensaje por defecto sin messages", async () => {
    server.use(http.get(`${API}/catalog/roles`, () => HttpResponse.json({}, { status: 500 })));
    expect((await getCatalogOptions("roles" as never)).messages).toEqual(["Error fetching catalog"]);
  });

  it("getCatalogBusinessLineServiceOptions: éxito y fallos", async () => {
    server.use(http.get(`${API}/catalog/business-line-service/3`, () => HttpResponse.json({ success: true, data: [] })));
    expect(await getCatalogBusinessLineServiceOptions(3)).toEqual({ success: true, data: [] });
    server.use(http.get(`${API}/catalog/business-line-service/3`, () => HttpResponse.json({ messages: ["m"] }, { status: 500 })));
    expect((await getCatalogBusinessLineServiceOptions(3)).messages).toEqual(["m"]);
    server.use(http.get(`${API}/catalog/business-line-service/3`, () => HttpResponse.json({}, { status: 500 })));
    expect((await getCatalogBusinessLineServiceOptions(3)).messages).toEqual([
      "Error fetching business line service catalog",
    ]);
  });
});

describe("fetchDataTable", () => {
  const params = { pageIndex: 0, pageSize: 10 } as never;

  it("devuelve rows/total del API", async () => {
    server.use(http.post(`${API}/t`, () => HttpResponse.json({ success: true, data: { rows: [{ id: 1 }], total: 1 } })));
    expect(await fetchDataTable("/t", params)).toEqual({ rows: [{ id: 1 }], total: 1 });
  });

  it("devuelve estructura vacía si el API no tiene éxito", async () => {
    server.use(http.post(`${API}/t`, () => HttpResponse.json({ success: false })));
    expect(await fetchDataTable("/t", params)).toEqual({ rows: [], total: 0 });
  });
});
