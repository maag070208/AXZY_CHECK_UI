import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { table } from "../helpers/api";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const entries = [
  {
    id: 1, timestamp: "2026-10-20T15:30:00.000Z", scanType: "ASSIGNMENT",
    user: { name: "Ana", lastName: "Pérez", username: "ana" }, location: { name: "Puerta Norte", aisle: "N" },
    media: [{ type: "IMAGE", url: "http://x/a.png" }, { type: "VIDEO", url: "http://x/b.mp4" }],
    notes: "--- Checklist ---\n[x] Puerta cerrada\n[ ] Luces apagadas\n\nTodo normal",
    latitude: 32.46, longitude: -116.92,
  },
  { id: 2, timestamp: "2026-10-20T16:00:00.000Z", scanType: "RECURRING", user: { name: "Beto", username: "beto" }, location: { name: "Alberca", aisle: "A" }, media: [] },
  { id: 3, timestamp: "2026-10-20T17:00:00.000Z", scanType: "FREE", user: { name: "Cami", lastName: "Soto", username: "cami" }, location: { name: "Gym", aisle: "G" } },
];

beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-20T19:00:00.000Z") }));
afterEach(() => vi.useRealTimers());

const open = async () => {
  const bodies = table("/kardex/datatable", entries, entries.length, "data");
  const r = renderApp({ route: "/kardex", role: "ADMIN" });
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText("Puerta Norte");
  return { ...r, bodies };
};
const dateInput = () => screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa");
const day = (n: number) => within(document.querySelector("[data-it-floating]") as HTMLElement).getAllByText(String(n), { selector: "span" })[0];

describe("kardex", () => {
  it("lista actividades con tipo y multimedia", async () => {
    await open();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Asignada")).toBeInTheDocument();
    expect(screen.getByText("Ronda")).toBeInTheDocument();
    expect(screen.getByText("Libre")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // archivos del primero
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Cami Soto")).toBeInTheDocument();
  });

  it("al abrir filtra por el día de hoy (Tijuana)", async () => {
    const { bodies } = await open();
    expect(bodies.at(-1).filters).toEqual({
      date: [
        dayjs("2026-10-20T19:00:00.000Z").tz("America/Tijuana").startOf("day").format(),
        dayjs("2026-10-20T19:00:00.000Z").tz("America/Tijuana").endOf("day").format(),
      ],
    });
  });

  it("buscar guardia agrega 'search' (recortado) y limpiar lo quita", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Nombre de guardia..."), " ana ");
    await waitFor(() => expect(bodies.at(-1).filters.search).toBe("ana"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1).filters.search).toBeUndefined());
  });

  it("buscar solo espacios no filtra", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Nombre de guardia..."), "  ");
    await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(3));
    expect(bodies.at(-1).filters.search).toBeUndefined();
  });

  it("filtra por tipo de escaneo y 'Todos' lo quita", async () => {
    const { user, bodies } = await open();
    await pickOption(user, screen.getByDisplayValue("Todos"), "Ronda");
    await waitFor(() => expect(bodies.at(-1).filters.scanType).toBe("RECURRING"));
    await pickOption(user, screen.getByDisplayValue("Ronda"), "Todos");
    await waitFor(() => expect(bodies.at(-1).filters.scanType).toBeUndefined());
  });

  it("cambiar el periodo (inicio y fin) vuelve a filtrar", async () => {
    const { user, bodies } = await open();
    await user.click(dateInput());
    await user.click(day(10));
    const n = bodies.length;
    await user.click(day(12));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    const [from, to] = bodies.at(-1).filters.date;
    expect(dayjs(from).date()).toBe(10);
    expect(dayjs(to).date()).toBe(12);
  });

  it("escribir una fecha a mano filtra ese día", async () => {
    const { user, bodies } = await open();
    await user.clear(dateInput());
    await user.type(dateInput(), "15102026");
    await waitFor(() => expect(dayjs(bodies.at(-1).filters.date[0]).date()).toBe(15));
    expect(dayjs(bodies.at(-1).filters.date[1]).date()).toBe(15);
  });

  it("elegir solo el inicio del periodo todavía no vuelve a filtrar", async () => {
    const { user, bodies } = await open();
    await user.click(dateInput());
    const n = bodies.length;
    await user.click(day(10));
    expect(bodies.length).toBe(n);
  });

  it("actualizar vuelve a pedir datos", async () => {
    const { user, bodies } = await open();
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar tabla" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("detalle con evidencia, notas formateadas y GPS", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalle" })[0]);
    const dialog = (await screen.findByText("Detalle de actividad")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("Checklist")).toBeInTheDocument();
    expect(within(dialog).getByText("Puerta cerrada")).toHaveClass("line-through");
    expect(within(dialog).getByText("Luces apagadas")).not.toHaveClass("line-through");
    expect(within(dialog).getByText("Todo normal")).toBeInTheDocument();
    expect(within(dialog).getByText("Pasillo N")).toBeInTheDocument();
    expect(within(dialog).getByText("32.460000, -116.920000")).toBeInTheDocument();
    expect(within(dialog).getByText("2 archivos")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /abrir en google maps/i }));
    expect(openSpy).toHaveBeenCalledWith("https://www.google.com/maps/search/?api=1&query=32.46,-116.92", "_blank");
  });

  it("detalle sin evidencia, sin notas y sin GPS", async () => {
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalle" })[1]);
    const dialog = (await screen.findByText("Detalle de actividad")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("Sin evidencia adjunta")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin observaciones registradas")).toBeInTheDocument();
    expect(within(dialog).queryByText("Ubicación GPS")).toBeNull();
    expect(within(dialog).getAllByText("Ronda").length).toBeGreaterThan(0);
  });

  it("detalle de escaneo libre y cierre con Escape", async () => {
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalle" })[2]);
    const dialog = (await screen.findByText("Detalle de actividad")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getAllByText("Libre").length).toBeGreaterThan(0);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Detalle de actividad")).toBeNull());
  });
});
