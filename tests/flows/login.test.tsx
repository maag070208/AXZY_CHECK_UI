import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { API, server } from "../helpers/server";
import { makeToken, renderApp } from "../helpers/render";

describe("login", () => {
  it("con credenciales válidas entra al panel", async () => {
    server.use(
      http.post(`${API}/users/login`, () => HttpResponse.json({ success: true, data: makeToken() })),
    );
    const { user, container } = renderApp({ route: "/login" });
    await screen.findByRole("button", { name: /iniciar sesión/i });
    await user.type(container.querySelector<HTMLInputElement>('input[name="username"]')!, "admin");
    await user.type(container.querySelector<HTMLInputElement>('input[name="password"]')!, "123456");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    expect(await screen.findByText("Admin")).toBeInTheDocument();
  });
});
