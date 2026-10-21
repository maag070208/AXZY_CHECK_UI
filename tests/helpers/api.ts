import { http, HttpResponse } from "msw";
import { API, server } from "./server";

export interface Seen {
  method: string;
  path: string;
  search: string;
  body: unknown;
}

/** Registra la última petición recibida en `method path` y responde `body`. */
export function stub(method: "get" | "post" | "put" | "patch" | "delete", path: string, body: unknown = { success: true, data: null }, status = 200) {
  const seen: Seen = { method: "", path: "", search: "", body: undefined };
  server.use(
    http[method](`${API}${path}`, async ({ request }) => {
      const url = new URL(request.url);
      seen.method = request.method;
      seen.path = url.pathname.replace("/api/v1", "");
      seen.search = url.search;
      if (request.method !== "GET" && request.method !== "DELETE") {
        seen.body = request.headers.get("content-type")?.includes("json") ? await request.json() : "form";
      }
      return HttpResponse.json(body as never, { status });
    }),
  );
  return seen;
}

import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { axiosInstance } from "@app/core/axios/axios";

type AdapterReply = { status?: number; data?: unknown } | Error;

/**
 * Sustituye el transporte de axios (no el servicio). jsdom + MSW no soportan bien FormData/Blob
 * por XHR, así que las subidas y descargas de PDF se prueban con un adaptador en memoria.
 * Se restaura en el afterEach global (tests/setup.ts).
 */
const originalAdapter = axiosInstance.defaults.adapter;
export const restoreTransport = () => {
  axiosInstance.defaults.adapter = originalAdapter;
};

export function mockTransport(reply: (config: InternalAxiosRequestConfig) => AdapterReply) {
  axiosInstance.defaults.adapter = async (config) => {
    const r = reply(config);
    if (r instanceof Error) throw r;
    const status = r.status ?? 200;
    const response = { data: r.data, status, statusText: "", headers: {}, config, request: {} };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, {}, response);
  };
}

/** Responde un `/…/datatable` con `rows` y registra los cuerpos recibidos (paginación, filtros, orden). */
export function table(path: string, rows: unknown[], total = rows.length, key: "rows" | "data" = "rows") {
  const bodies: any[] = [];
  server.use(
    http.post(`${API}${path}`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ success: true, data: { [key]: rows, total } });
    }),
  );
  return bodies;
}

/** Responde con error HTTP en JSON, con el formato de la API. */
export function fail(method: "get" | "post" | "put" | "patch" | "delete", path: string, messages: string[] = ["Falló"], status = 400) {
  server.use(http[method](`${API}${path}`, () => HttpResponse.json({ success: false, message: messages[0], messages }, { status })));
}
