import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { liveDashboard } from "./fixtures";

export const API = "http://api.test/api/v1";

/** Lo que el shell (Home + barra lateral) pide siempre; las pruebas lo pisan con `server.use(...)`. */
export const baseHandlers = [
  http.get(`${API}/dashboard/live`, () => HttpResponse.json({ success: true, data: liveDashboard() })),
  http.get(`${API}/realtime/token`, () => HttpResponse.json({ success: true, data: { token: "t" } })),
  http.post(`${API}/users/logout`, () => HttpResponse.json({ success: true })),
];

/** API simulada: lo no declarado falla la prueba (onUnhandledRequest: "error"). */
export const server = setupServer(...baseHandlers);
