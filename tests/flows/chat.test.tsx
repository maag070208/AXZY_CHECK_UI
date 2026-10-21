import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { ChatPanel } from "@app/modules/chat/components/ChatPanel";
import { ablyProbe, emitAbly } from "../helpers/ably";
import { stub } from "../helpers/api";
import { makeToken, renderApp, renderWithProviders } from "../helpers/render";
import { API, server } from "../helpers/server";
import { setAuth } from "@app/core/store/auth/auth.slice";

const toast = () => store.getState().toast;
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const msg = (id: number, userId: number, text: string, createdAt: string, extra: Record<string, unknown> = {}) => ({
  id, message: text, createdAt, user: { id: userId, name: userId === 1 ? "Admin" : "Beto", lastName: userId === 1 ? "" : "Ruiz", ...extra },
});

/** La API devuelve del más nuevo al más viejo. */
const history = [
  msg(4, 2, "tercero", minutesAgo(1)),
  msg(3, 2, "segundo", minutesAgo(2)),
  msg(2, 1, "mío", minutesAgo(3)),
  msg(1, 2, "ayer", daysAgo(1)),
];

const openPage = async (data: unknown[] = history) => {
  stub("get", "/chat/messages", { success: true, data });
  const r = renderApp({ route: "/chat", role: "ADMIN" });
  await screen.findByText("Canal general");
  return r;
};
const box = () => screen.getByPlaceholderText("Escribe un mensaje...");
const sendBtn = () => screen.getByRole("button", { name: "Enviar mensaje" });


describe("chat: lectura", () => {
  it("muestra el historial en orden cronológico con separadores de día", async () => {
    await openPage();
    await screen.findByText("tercero");
    const text = document.body.textContent!;
    expect(text.indexOf("ayer")).toBeLessThan(text.indexOf("mío"));
    expect(text.indexOf("mío")).toBeLessThan(text.indexOf("segundo"));
    expect(text.indexOf("segundo")).toBeLessThan(text.indexOf("tercero"));
    expect(screen.getByText("Ayer")).toBeInTheDocument();
    expect(screen.getByText("Hoy")).toBeInTheDocument();
    expect(screen.getByText("En vivo")).toBeInTheDocument();
  });

  it("días anteriores a ayer muestran la fecha larga", async () => {
    await openPage([msg(1, 2, "viejo", daysAgo(5))]);
    await screen.findByText("viejo");
    expect(screen.queryByText("Hoy")).toBeNull();
    expect(screen.queryByText("Ayer")).toBeNull();
    expect(document.body.textContent).toMatch(/de /);
  });

  it("agrupa ráfagas del mismo autor: un solo nombre por ráfaga", async () => {
    await openPage();
    await screen.findByText("tercero");
    expect(screen.getAllByText("Beto Ruiz")).toHaveLength(2); // "ayer" y la ráfaga segundo+tercero
  });

  it("mensajes muy separados en el tiempo no se agrupan", async () => {
    await openPage([msg(2, 2, "b", minutesAgo(1)), msg(1, 2, "a", minutesAgo(30))]);
    await screen.findByText("b");
    expect(screen.getAllByText("Beto Ruiz")).toHaveLength(2);
  });

  it("sin mensajes muestra el estado vacío", async () => {
    await openPage([]);
    expect(await screen.findByText("Todavía no hay mensajes")).toBeInTheDocument();
  });

  it("si la carga falla deja el estado vacío", async () => {
    stub("get", "/chat/messages", { success: false });
    renderApp({ route: "/chat", role: "ADMIN" });
    expect(await screen.findByText("Todavía no hay mensajes")).toBeInTheDocument();
  });

  it("autor sin apellido ni inicial no rompe", async () => {
    await openPage([
      { id: 2, message: "sin nombre", createdAt: minutesAgo(1), user: { id: 4 } },
      { id: 1, message: "hola", createdAt: minutesAgo(2), user: { id: 3, name: "", lastName: null } },
    ]);
    expect(await screen.findByText("hola")).toBeInTheDocument();
    expect(screen.getByText("sin nombre")).toBeInTheDocument();
  });

  it("el polling recarga cada 10 s y se detiene al desmontar", async () => {
    // Se intercepta solo el intervalo de 10 s; el resto (waitFor, etc.) usa el reloj real.
    const real = globalThis.setInterval;
    const ticks: (() => void)[] = [];
    const cleared: unknown[] = [];
    vi.spyOn(globalThis, "setInterval").mockImplementation(((fn: () => void, ms?: number, ...a: unknown[]) => {
      if (ms === 10000) {
        ticks.push(fn);
        return 999 as never;
      }
      return real(fn, ms, ...a);
    }) as never);
    vi.spyOn(globalThis, "clearInterval").mockImplementation(((id: unknown) => void cleared.push(id)) as never);
    let calls = 0;
    server.use(http.get(`${API}/chat/messages`, () => ((calls += 1), HttpResponse.json({ success: true, data: [] }))));
    const { unmount } = renderApp({ route: "/chat", role: "ADMIN" });
    await waitFor(() => expect(calls).toBe(1));
    await act(async () => ticks[0]());
    await waitFor(() => expect(calls).toBe(2));
    unmount();
    expect(cleared).toContain(999);
  });
});

describe("chat: enviar", () => {
  it("no envía vacío ni solo espacios", async () => {
    const sent = stub("post", "/chat/messages", { success: true, data: msg(9, 1, "x", minutesAgo(0)) });
    const { user } = await openPage();
    expect(sendBtn()).toBeDisabled();
    await user.type(box(), "   ");
    expect(sendBtn()).toBeDisabled();
    await user.keyboard("{Enter}");
    expect(sent.method).toBe("");
  });

  it("envía con el botón: agrega el mensaje, limpia y enfoca", async () => {
    const sent = stub("post", "/chat/messages", { success: true, data: msg(9, 1, "hola equipo", minutesAgo(0)) });
    const { user } = await openPage();
    await user.type(box(), "  hola equipo ");
    await user.click(sendBtn());
    await waitFor(() => expect(sent.body).toEqual({ message: "hola equipo" }));
    expect(await screen.findByText("hola equipo")).toBeInTheDocument();
    expect(box()).toHaveValue("");
    expect(box()).toHaveFocus();
  });

  it("Enter envía y Shift+Enter no", async () => {
    const sent = stub("post", "/chat/messages", { success: true, data: msg(9, 1, "uno", minutesAgo(0)) });
    const { user } = await openPage();
    await user.type(box(), "uno{Shift>}{Enter}{/Shift}dos");
    expect(sent.method).toBe("");
    expect(box()).toHaveValue("uno\ndos");
    await user.clear(box());
    await user.type(box(), "uno{Enter}");
    await waitFor(() => expect(sent.body).toEqual({ message: "uno" }));
  });

  it("si el API no tiene éxito muestra su mensaje o el genérico y conserva el borrador", async () => {
    stub("post", "/chat/messages", { success: false, messages: ["Chat en pausa"] });
    const { user } = await openPage();
    await user.type(box(), "hola");
    await user.click(sendBtn());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Chat en pausa", type: "error" }));
    expect(box()).toHaveValue("hola");
    stub("post", "/chat/messages", { success: false });
    await user.click(sendBtn());
    await waitFor(() => expect(toast().message).toBe("No se pudo enviar"));
  });

  it("error HTTP: mensaje del servidor o 'Error de conexión'", async () => {
    stub("post", "/chat/messages", { messages: ["Muy largo"] }, 400);
    const { user } = await openPage();
    await user.type(box(), "hola");
    await user.click(sendBtn());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Muy largo", type: "error" }));
    stub("post", "/chat/messages", {}, 500);
    await user.click(sendBtn());
    await waitFor(() => expect(toast().message).toBe("Error de conexión"));
  });

  it("mientras envía ignora un segundo envío", async () => {
    let hits = 0;
    let release!: () => void;
    server.use(
      http.post(`${API}/chat/messages`, async () => {
        hits += 1;
        await new Promise<void>((r) => (release = r));
        return HttpResponse.json({ success: true, data: msg(9, 1, "x", minutesAgo(0)) });
      }),
    );
    const { user } = await openPage();
    await user.type(box(), "x");
    await user.click(sendBtn());
    await waitFor(() => expect(sendBtn()).toBeDisabled());
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(hits).toBe(1);
    release();
    await waitFor(() => expect(sendBtn()).toBeDisabled()); // borrador vacío tras enviar
  });
});

describe("chat: tiempo real", () => {
  it("agrega mensajes nuevos de Ably y descarta duplicados", async () => {
    await openPage();
    await screen.findByText("tercero");
    act(() => emitAbly("chat:team", "new-message", msg(10, 2, "en vivo", minutesAgo(0))));
    expect(await screen.findByText("en vivo")).toBeInTheDocument();
    act(() => emitAbly("chat:team", "new-message", msg(10, 2, "en vivo", minutesAgo(0))));
    expect(screen.getAllByText("en vivo")).toHaveLength(1);
  });

  it("pide el token a la API y lo entrega a Ably", async () => {
    stub("get", "/realtime/token", { success: true, data: { token: "abc" } });
    await openPage();
    const cb = vi.fn();
    await ablyProbe.options!.authCallback!({}, cb);
    expect(cb).toHaveBeenCalledWith(null, { token: "abc" });
  });

  it("token no disponible o error HTTP → error para Ably", async () => {
    await openPage();
    stub("get", "/realtime/token", { success: false });
    const cb = vi.fn();
    await ablyProbe.options!.authCallback!({}, cb);
    expect(cb).toHaveBeenCalledWith("No se pudo obtener el token de tiempo real", null);
    stub("get", "/realtime/token", { message: "x" }, 500);
    const cb2 = vi.fn();
    await ablyProbe.options!.authCallback!({}, cb2);
    expect(cb2).toHaveBeenCalledWith({ message: "x" }, null);
  });

  it("si Ably no se puede iniciar sigue funcionando por polling", async () => {
    ablyProbe.throwOnConnect = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await openPage();
    await screen.findByText("tercero");
    expect(warn).toHaveBeenCalled();
  });

  it.each(["promise", "undefined", "rejected"] as const)("al desmontar cierra Ably (%s)", async (mode) => {
    ablyProbe.closeReturns = mode;
    const { unmount } = await openPage();
    unmount();
    expect(ablyProbe.closed).toBe(1);
  });
});

describe("chat: scroll", () => {
  const scrollSpy = () => vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});

  it("baja al último mensaje al cargar y cuando llega uno nuevo estando al final", async () => {
    const spy = scrollSpy();
    await openPage();
    await screen.findByText("tercero");
    spy.mockClear();
    act(() => emitAbly("chat:team", "new-message", msg(10, 2, "nuevo", minutesAgo(0))));
    await screen.findByText("nuevo");
    expect(spy).toHaveBeenCalled();
  });

  it("si la persona leía arriba, un mensaje ajeno no la mueve; uno propio sí", async () => {
    const spy = scrollSpy();
    const { user } = await openPage();
    await screen.findByText("tercero");
    const list = screen.getByText("tercero").closest("div[class*=overflow-y-auto]") as HTMLElement;
    Object.defineProperties(list, {
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 100, configurable: true },
      scrollTop: { value: 0, configurable: true },
    });
    fireEvent.scroll(list);
    spy.mockClear();
    act(() => emitAbly("chat:team", "new-message", msg(10, 2, "ajeno", minutesAgo(0))));
    await screen.findByText("ajeno");
    expect(spy).not.toHaveBeenCalled();

    stub("post", "/chat/messages", { success: true, data: msg(11, 1, "propio", minutesAgo(0)) });
    await user.type(box(), "propio");
    await user.click(sendBtn());
    await screen.findByText("propio");
    await waitFor(() => expect(spy).toHaveBeenCalled());
  });
});

describe("chat: panel compacto", () => {
  it("variante sidebar usa el encabezado compacto", async () => {
    stub("get", "/chat/messages", { success: true, data: history });
    store.dispatch(setAuth(makeToken({ id: 1 })));
    renderWithProviders(<ChatPanel variant="sidebar" />);
    expect(await screen.findByText("Chat del equipo")).toBeInTheDocument();
    expect(await screen.findByText("tercero")).toBeInTheDocument();
  });
});
