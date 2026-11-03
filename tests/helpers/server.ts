import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { liveDashboard } from "./fixtures";
import { permissionsForRole, roleFromAuthHeader } from "./permissions";

export const API = "http://api.test/api/v1";

/** Lo que el shell (Home + barra lateral) pide siempre; las pruebas lo pisan con `server.use(...)`. */
export const baseHandlers = [
  // Restaurar sesión (sin token, cookie HttpOnly) → 401 en tests. Con token
  // (login recién hecho) devuelve el alcance fijo del rol, como el API real.
  http.get(`${API}/users/me`, ({ request }) => {
    const role = roleFromAuthHeader(request.headers.get("Authorization"));
    if (!role) return HttpResponse.json({ success: false }, { status: 401 });
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: "Admin",
        email: "admin@check.app",
        role,
        clientId: role === "CLIENT" ? 2 : 1,
        organizationId: 1,
      },
    });
  }),
  http.post(`${API}/users/refresh`, () => HttpResponse.json({ success: false }, { status: 401 })),
  http.get(`${API}/users/me/permissions`, ({ request }) => {
    const role = roleFromAuthHeader(request.headers.get("Authorization"));
    const permissions = permissionsForRole(role);
    return HttpResponse.json({
      success: true,
      data: { role, permissions: permissionsForRole(role) },
    });
  }),
  // Fase 3: el shell de ADMIN/MAINT carga los clientes de la organización.
  // Por defecto una organización de producto 1 (un solo cliente, auto-selección).
  http.get(`${API}/clients`, () =>
    HttpResponse.json({
      success: true,
      data: [{ id: 1, name: "Cliente Base", type: "RESIDENTIAL", active: true, organizationId: 1 }],
    }),
  ),
  http.get(`${API}/dashboard/live`, () => HttpResponse.json({ success: true, data: liveDashboard() })),
  http.get(`${API}/realtime/token`, () => HttpResponse.json({ success: true, data: { token: "t" } })),
  http.post(`${API}/users/logout`, () => HttpResponse.json({ success: true })),
];

/** API simulada: lo no declarado falla la prueba (onUnhandledRequest: "error"). */
export const server = setupServer(...baseHandlers);
