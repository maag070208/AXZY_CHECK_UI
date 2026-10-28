import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { makeToken, renderApp } from "../helpers/render";
import { API, server } from "../helpers/server";

const fillAndSubmit = async (r: ReturnType<typeof renderApp>, password: string) => {
  await screen.findByRole("button", { name: /iniciar sesión/i });
  await r.user.type(r.container.querySelector<HTMLInputElement>('input[name="username"]')!, "admin");
  await r.user.type(r.container.querySelector<HTMLInputElement>('input[name="password"]')!, password);
  await r.user.click(screen.getByRole("button", { name: /iniciar sesión/i }));
};

describe("login", () => {
  it("con credenciales válidas entra al panel", async () => {
    server.use(http.post(`${API}/users/login`, () => HttpResponse.json({ success: true, data: makeToken() })));
    await fillAndSubmit(renderApp({ route: "/login" }), "123456");
    expect(await screen.findByText("Hoy en números")).toBeInTheDocument();
    expect(store.getState().auth.token).not.toBeNull();
  });

  it("con contraseña incorrecta se queda en el login", async () => {
    server.use(
      http.post(`${API}/users/login`, () => HttpResponse.json({ success: false, message: "Credenciales inválidas" })),
    );
    await fillAndSubmit(renderApp({ route: "/login" }), "incorrecta");
    expect(await screen.findByText("Credenciales inválidas")).toBeInTheDocument();
    expect(store.getState().auth.token).toBeNull();
  });

  it("si el API responde error HTTP muestra el aviso genérico", async () => {
    server.use(http.post(`${API}/users/login`, () => HttpResponse.json({ message: "boom" }, { status: 500 })));
    await fillAndSubmit(renderApp({ route: "/login" }), "123456");
    expect(await screen.findByText("Error al iniciar sesión")).toBeInTheDocument();
    expect(store.getState().auth.token).toBeNull();
  });

  it("el candado muestra y oculta la contraseña", async () => {
    const { user, container } = renderApp({ route: "/login" });
    await screen.findByRole("button", { name: /iniciar sesión/i });
    const pass = () => container.querySelector<HTMLInputElement>('input[name="password"]')!;
    expect(pass().type).toBe("password");
    await user.click(screen.getByLabelText("Mostrar contraseña"));
    expect(pass().type).toBe("text");
    await user.click(screen.getByLabelText("Ocultar contraseña"));
    expect(pass().type).toBe("password");
  });

  it("cerrar sesión regresa al login y borra el token", async () => {
    const { user } = renderApp({ route: "/home", role: "ADMIN" });
    await screen.findByText("Hoy en números");
    await user.click(screen.getAllByText("Admin")[0]);
    await user.click(screen.getByText("Cerrar Sesión"));
    await waitFor(() => expect(store.getState().auth.token).toBeNull());
    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});

describe("login: color del último rol", () => {
  it("sin sesión previa muestra el verde normal", async () => {
    renderApp({ route: "/login" });
    expect(await screen.findByText("CHECKAPP RESIDENCIAL")).toBeInTheDocument();
    expect(screen.getByText("La comunidad, más simple y segura.")).toBeInTheDocument();
  });

  it.each([
    ["GUARD", "ACCESO GUARDIA", "Tu ronda, tu caseta, todo en un lugar."],
    ["RESDN", "ACCESO RESIDENTE", "Tu comunidad, más simple y segura."],
    ["SHIFT", "ACCESO JEFE DE GUARDIAS", "Cada turno, coordinado y sin huecos."],
    ["ADMIN", "ACCESO ADMINISTRATIVO", "La operación, clara y bajo control."],
  ])("recuerda el último rol %s tras cerrar sesión", async (role, eyebrow, headline) => {
    renderApp({ route: "/login", lastRole: role });
    expect(await screen.findByText(eyebrow)).toBeInTheDocument();
    expect(screen.getByText(headline)).toBeInTheDocument();
  });

  it("guarda el rol al iniciar sesión para el próximo login", async () => {
    server.use(http.post(`${API}/users/login`, () => HttpResponse.json({ success: true, data: makeToken({ role: "GUARD" }) })));
    await fillAndSubmit(renderApp({ route: "/login" }), "123456");
    await waitFor(() => expect(localStorage.getItem("lastRole")).toBe("GUARD"));
  });
});
