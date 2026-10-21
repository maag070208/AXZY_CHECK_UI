import { act, screen, waitFor, within } from "@testing-library/react";
import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { fail, mockTransport, stub, table } from "../helpers/api";
import { renderApp } from "../helpers/render";
import { API, server } from "../helpers/server";
import { pickOption } from "../helpers/ui";

// `html-to-image` intenta rasterizar con canvas real; en jsdom devolvemos un Blob controlable.
// (Solo se mockea a nivel de este archivo; QRCode.toDataURL sigue siendo el real.)
const passImage = vi.hoisted(() => ({ blob: null as Blob | null }));
vi.mock("html-to-image", () => ({ toBlob: vi.fn(async () => passImage.blob) }));

const statuses = [
  { id: 1, name: "PENDING", value: "En espera" },
  { id: 2, name: "ENTERED", value: "Dentro" },
  { id: 3, name: "EXITED", value: "Completado" },
  { id: 4, name: "EXPIRED", value: "Expirada" },
  { id: 5, name: "CANCELLED", value: "Revocada" },
];

const types = [
  { id: 1, name: "PROV", value: "Proveedor" },
  { id: 2, name: "VISIT", value: "Visita" },
];

const properties = [
  { id: 1, identifier: "A-101", name: "Casa 101" },
  { id: 2, identifier: "B-202", name: "Casa 202" },
];

const rows = [
  {
    id: 1, code: "AXZ-1001", guestName: "Ana Pérez", propertyId: 1,
    property: { id: 1, identifier: "A-101", name: "Casa 101" },
    typeId: 1, type: { id: 1, name: "PROV", value: "Proveedor" },
    validFrom: "2026-10-01T18:00:00.000Z", validUntil: "2026-10-31T18:00:00.000Z",
    status: "PENDING", entryTime: null, exitTime: null,
    createdBy: { id: 1, name: "Admin", lastName: "Check" },
  },
  {
    id: 2, code: "AXZ-1002", guestName: "Beto Ruiz", propertyId: 2,
    property: { id: 2, identifier: "B-202", name: "Casa 202" },
    typeId: 2, type: { id: 2, name: "VISIT", value: "Visita" },
    validFrom: "2026-10-10T18:00:00.000Z", validUntil: "2026-10-12T18:00:00.000Z",
    status: "ENTERED", entryTime: "2026-10-20T15:30:00.000Z",
    createdBy: { id: 1, name: "Admin", lastName: "Check" },
  },
  {
    id: 3, code: "AXZ-1003", guestName: "Cami Soto", propertyId: 1,
    property: { id: 1, identifier: "A-101", name: "Casa 101" },
    validFrom: "2026-10-18T18:00:00.000Z", validUntil: "2026-10-19T18:00:00.000Z",
    status: "EXITED",
    entryTime: "2026-10-18T14:00:00.000Z", exitTime: "2026-10-18T16:30:00.000Z",
    createdBy: { id: 2, name: "Eva", lastName: "Gil" },
  },
  {
    id: 4, code: "AXZ-1004", guestName: "Dani León", typeId: 2,
    validFrom: "2026-10-15T18:00:00.000Z", validUntil: "2026-10-16T18:00:00.000Z",
    status: "EXPIRED",
  },
  {
    id: 5, code: "AXZ-1005", guestName: "Eva Gil", propertyId: 2,
    property: { id: 2, identifier: "B-202", name: "Casa 202" },
    typeId: 2, type: { id: 2, name: "VISIT", value: "Visita" },
    validFrom: "2026-10-20T18:00:00.000Z", validUntil: "2026-10-21T18:00:00.000Z",
    status: "CANCELLED",
  },
  {
    id: 6, code: "AXZ-1006", guestName: "Fabi Luna",
    validFrom: "2026-10-01T18:00:00.000Z", validUntil: "2026-10-02T18:00:00.000Z",
    status: "WEIRD",
  },
];

const toast = () => store.getState().toast;
const dialogOf = (title: string) => screen.findByText(title).then((el) => el.closest("[data-it-dialog]") as HTMLElement);

const lastFloating = () => {
  const all = document.querySelectorAll<HTMLElement>("[data-it-floating]");
  return all[all.length - 1];
};

/** Como `pickOption`, pero reintenta hasta que las opciones cargadas por el API aparezcan. */
async function choose(user: ReturnType<typeof renderApp>["user"], input: HTMLElement, option: string) {
  await user.click(input);
  await waitFor(() => expect(document.querySelector("[data-it-floating]")).not.toBeNull());
  await user.click(await within(lastFloating()).findByText(option));
}

const day = (n: number) => within(lastFloating()).getAllByText(String(n), { selector: "span" })[0];

const open = async () => {
  stub("get", "/catalog/invitation_status", { success: true, data: statuses });
  stub("get", "/catalog/invitation_type", { success: true, data: types });
  stub("get", "/properties", { success: true, data: properties });
  const bodies = table("/invitations/datatable", rows);
  const r = renderApp({ route: "/invitations", role: "ADMIN" });
  // La página remonta la tabla tras 500 ms de debounce: se espera esa segunda carga para no leer en el hueco.
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText("AXZ-1001");
  return { ...r, bodies };
};

const openCreate = async () => {
  const ctx = await open();
  await ctx.user.click(screen.getByRole("button", { name: "Crear pase" }));
  const dialog = await dialogOf("Generar Nuevo Pase de Acceso");
  return { ...ctx, dialog };
};

const formField = (dialog: HTMLElement, name: string) => dialog.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;

const fillForm = async (user: ReturnType<typeof renderApp>["user"], dialog: HTMLElement) => {
  await user.type(within(dialog).getByPlaceholderText("Ej. Luis Hernandez Silva"), "Luis Hernandez Silva");
  await choose(user, formField(dialog, "propertyId"), "A-101 - Casa 101");
  await choose(user, formField(dialog, "typeId"), "Visita");
  await user.click(within(dialog).getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa"));
  await waitFor(() => expect(document.querySelector("[data-it-floating]")).not.toBeNull());
  await user.click(day(10));
  await user.click(day(12));
  await user.type(within(dialog).getByPlaceholderText("Auto civic blanco, viene a reparar tubería..."), "Auto blanco, portón negro");
};

const openQr = async (idx = 0) => {
  const ctx = await open();
  await ctx.user.click(screen.getAllByRole("button", { name: "Ver gafete QR" })[idx]);
  const dialog = await dialogOf("Pase de acceso");
  await within(dialog).findByAltText(`QR ${rows[idx].code}`);
  return { ...ctx, dialog };
};

const openRevoke = async () => {
  const ctx = await open();
  await ctx.user.click(screen.getAllByRole("button", { name: "Revocar acceso" })[0]);
  const dialog = await dialogOf("Aviso de Seguridad");
  return { ...ctx, dialog };
};

const openScan = async (label: "Aprobar ingreso" | "Aprobar salida", title: string) => {
  const ctx = await open();
  await ctx.user.click(screen.getAllByRole("button", { name: label })[0]);
  const dialog = await dialogOf(title);
  const input = within(dialog).getByPlaceholderText("AXZ-XXXX") as HTMLInputElement;
  return { ...ctx, dialog, input };
};

const captureDownload = () => {
  const clicked: Array<{ href: string; download: string }> = [];
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push({ href: this.href, download: this.download });
  });
  return clicked;
};

const stubNavigator = (key: "clipboard" | "share", value: unknown) =>
  Object.defineProperty(navigator, key, { value, configurable: true });

const coarsePointer = () =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(pointer: coarse)",
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }));

beforeEach(() => {
  passImage.blob = new Blob(["png"], { type: "image/png" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as any).clipboard;
  delete (navigator as any).share;
});

describe("invitaciones: listado", () => {
  it("muestra pases, invitado, propiedad, tipo, vigencia, estados y registro", async () => {
    const { bodies } = await open();
    expect(bodies[0]).toMatchObject({ page: 1, limit: 50 });

    // Pases y datos del invitado / propiedad.
    expect(screen.getByText("AXZ-1001")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Cami Soto")).toBeInTheDocument();
    expect(screen.getAllByText("B-202").length).toBeGreaterThanOrEqual(2);

    // PROV va resaltado con el color primario; sin tipo el default es "Visita".
    const prov = screen.getByText("Proveedor");
    expect(prov.className).toContain("bg-primary-700");
    // 1 pase con tipo VISIT explícito + 4 sin tipo (default "Visita").
    expect(screen.getAllByText("Visita")).toHaveLength(5);
    expect(screen.getAllByText("Visita")[0].className).not.toContain("bg-primary-700");

    // Vigencia calculada con dayjs (locale es).
    const vigencia = `${dayjs(rows[0].validFrom).format("DD MMM")} → ${dayjs(rows[0].validUntil).format("DD MMM")}`;
    expect(screen.getByText(vigencia)).toBeInTheDocument();

    // Estados traducidos + estado desconocido tal cual.
    expect(screen.getByText("En espera")).toBeInTheDocument();
    expect(screen.getByText("Dentro")).toBeInTheDocument();
    expect(screen.getByText("Completado")).toBeInTheDocument();
    expect(screen.getByText("Expirada")).toBeInTheDocument();
    expect(screen.getByText("Revocada")).toBeInTheDocument();
    expect(screen.getByText("WEIRD")).toBeInTheDocument();

    // Registro de entrada/salida; guion cuando no hay dato.
    const entrada = `In: ${dayjs(rows[1].entryTime).format("DD MMM HH:mm")} · Out: —`;
    const salida = `In: ${dayjs(rows[2].entryTime).format("DD MMM HH:mm")} · Out: ${dayjs(rows[2].exitTime).format("DD MMM HH:mm")}`;
    expect(screen.getByText(entrada)).toBeInTheDocument();
    expect(screen.getByText(salida)).toBeInTheDocument();
    expect(screen.getAllByText("In: — · Out: —").length).toBeGreaterThanOrEqual(3);
  });

  it("solo PENDING ofrece ingreso/revocación y solo ENTERED ofrece salida", async () => {
    await open();
    expect(screen.getAllByRole("button", { name: "Ver gafete QR" })).toHaveLength(rows.length);
    expect(screen.getAllByRole("button", { name: "Aprobar ingreso" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Revocar acceso" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Aprobar salida" })).toHaveLength(1);

    // La fila 1 es la única con "Aprobar ingreso" y la 2 la única con "Aprobar salida".
    const ingreso = screen.getByRole("button", { name: "Aprobar ingreso" });
    const salida = screen.getByRole("button", { name: "Aprobar salida" });
    expect(ingreso).toBeInTheDocument();
    expect(salida).toBeInTheDocument();
  });

  it("buscar manda el texto recortado y limpiar lo quita", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Buscar código o invitado..."), "  AXZ-1001  ");
    await waitFor(() => expect(bodies.at(-1)!.filters.search).toBe("AXZ-1001"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1)!.filters.search).toBeUndefined());
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });

  it("buscar solo espacios no filtra", async () => {
    const { user, bodies } = await open();
    const n = bodies.length;
    await user.type(screen.getByPlaceholderText("Buscar código o invitado..."), "   ");
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    expect(bodies.at(-1)!.filters.search).toBeUndefined();
  });

  it("filtra por estado del catálogo, refresca y 'Todos los estados' lo quita", async () => {
    const { user, bodies } = await open();
    await pickOption(user, screen.getByDisplayValue("Todos los estados"), "Dentro");
    await waitFor(() => expect(bodies.at(-1)!.filters.status).toBe("ENTERED"));

    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Refrescar datos" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    expect(bodies.at(-1)!.filters.status).toBe("ENTERED");

    await pickOption(user, screen.getByDisplayValue("Dentro"), "Todos los estados");
    await waitFor(() => expect(bodies.at(-1)!.filters.status).toBeUndefined());
  });

  it("el botón refrescar vuelve a pedir datos", async () => {
    const { user, bodies } = await open();
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Refrescar datos" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    expect(bodies.at(-1)!.page).toBe(1);
  });
});

describe("invitaciones: alta", () => {
  it("valida nombre, propiedad y tipo con Yup", async () => {
    const created = stub("post", "/invitations");
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Generar Invitación QR" }));
    expect(await within(dialog).findByText("El nombre del visitante es requerido")).toBeInTheDocument();
    expect(within(dialog).getByText("Debes asignar la propiedad destino")).toBeInTheDocument();
    expect(within(dialog).getByText("Selecciona el tipo de acceso")).toBeInTheDocument();
    expect(created.method).toBe("");
  });

  it("crea el pase con createdById, fechas del rango y notas; cierra y abre el QR", async () => {
    const created = stub("post", "/invitations", {
      success: true,
      data: { ...rows[0], id: 20, code: "AXZ-2000", guestName: "Luis Hernandez Silva", status: "PENDING" },
    });
    const { user, dialog, bodies } = await openCreate();
    await fillForm(user, dialog);
    const n = bodies.length;
    await user.click(within(dialog).getByRole("button", { name: "Generar Invitación QR" }));

    await waitFor(() => expect(created.body).toMatchObject({
      guestName: "Luis Hernandez Silva",
      propertyId: "1",
      typeId: "2",
      notes: "Auto blanco, portón negro",
      createdById: 1,
    }));
    const body = created.body as any;
    expect(new Date(body.validFrom).getDate()).toBe(10);
    expect(new Date(body.validUntil).getDate()).toBe(12);

    await waitFor(() => expect(toast()).toMatchObject({ message: "Invitación generada exitosamente", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Generar Nuevo Pase de Acceso")).toBeNull());
    const qrDialog = await dialogOf("Pase de acceso");
    expect(within(qrDialog).getByText("AXZ-2000")).toBeInTheDocument();
    expect(await within(qrDialog).findByAltText("QR AXZ-2000")).toBeInTheDocument();
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("si el API no devuelve data avisa, cierra y no abre el QR", async () => {
    stub("post", "/invitations", { success: true });
    const { user, dialog } = await openCreate();
    await fillForm(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Generar Invitación QR" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Invitación generada exitosamente", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Generar Nuevo Pase de Acceso")).toBeNull());
    expect(screen.queryByText("Pase de acceso")).toBeNull();
  });

  it("error del API con mensajes", async () => {
    fail("post", "/invitations", ["Sin cupo disponible"], 400);
    const { user, dialog } = await openCreate();
    await fillForm(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Generar Invitación QR" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Sin cupo disponible", type: "error" }));
    expect(within(dialog).getByText("Generar Nuevo Pase de Acceso")).toBeInTheDocument();
  });

  it("error del API sin mensajes usa el texto por defecto", async () => {
    stub("post", "/invitations", { success: false });
    const { user, dialog } = await openCreate();
    await fillForm(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Generar Invitación QR" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al generar invitación", type: "error" }));
  });

  it("error de red: falla el POST y avisa", async () => {
    const { user, dialog } = await openCreate();
    await fillForm(user, dialog);
    mockTransport(() => new Error("Network Error"));
    await user.click(within(dialog).getByRole("button", { name: "Generar Invitación QR" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error creating invitation", type: "error" }));
  });

  it("cancelar cierra el diálogo sin enviar", async () => {
    const created = stub("post", "/invitations");
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Generar Nuevo Pase de Acceso")).toBeNull());
    expect(created.method).toBe("");
  });
});

describe("invitaciones: gafete QR", () => {
  it("renderiza pase, código, invitado, destino, autor, estado y el QR real", async () => {
    const { dialog } = await openQr(0);
    expect(within(dialog).getByText("Pase de acceso")).toBeInTheDocument();
    expect(within(dialog).getByText("AXZ-1001")).toBeInTheDocument();
    expect(within(dialog).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(dialog).getByText("A-101")).toBeInTheDocument();
    expect(within(dialog).getByText("Casa 101")).toBeInTheDocument();
    expect(within(dialog).getByText("Admin Check")).toBeInTheDocument();
    expect(within(dialog).getByText("En espera")).toBeInTheDocument();
    expect(within(dialog).getByText("Proveedor")).toBeInTheDocument();
    expect(within(dialog).getByAltText("QR AXZ-1001")).toBeInTheDocument();
  });

  it("sin propiedad muestra 'Sin propiedad' y su estado traducido", async () => {
    const { dialog } = await openQr(3);
    expect(within(dialog).getByText("Sin propiedad")).toBeInTheDocument();
    expect(within(dialog).getByText("—")).toBeInTheDocument();
    expect(within(dialog).getByText("Expirado")).toBeInTheDocument();
  });

  it("PDF llama a window.print", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const { user, dialog } = await openQr(0);
    await user.click(within(dialog).getByRole("button", { name: "PDF" }));
    expect(print).toHaveBeenCalled();
  });

  it("Cerrar cierra el gafete", async () => {
    const { user } = await openQr(0);
    await user.click(screen.getAllByRole("button", { name: "Cerrar" }).at(-1)!);
    await waitFor(() => expect(screen.queryByText("Pase de acceso")).toBeNull());
  });

  it("WhatsApp móvil comparte el archivo con navigator.share", async () => {
    coarsePointer();
    const share = vi.fn().mockResolvedValue(undefined);
    stubNavigator("share", share);
    stubNavigator("clipboard", undefined);
    const { user, dialog } = await openQr(0);
    await user.click(within(dialog).getByRole("button", { name: "WhatsApp" }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const data = share.mock.calls[0][0];
    expect(data.text).toContain("Pase de acceso CheckApp");
    expect(data.text).toContain("AXZ-1001");
    expect(data.files[0].name).toBe("pase-AXZ-1001.png");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("WhatsApp móvil con AbortError no descarga ni abre WhatsApp", async () => {
    coarsePointer();
    const abort = Object.assign(new Error("abort"), { name: "AbortError" });
    const share = vi.fn().mockRejectedValue(abort);
    stubNavigator("share", share);
    stubNavigator("clipboard", undefined);
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const anchor = captureDownload();
    const { user, dialog } = await openQr(0);
    await user.click(within(dialog).getByRole("button", { name: "WhatsApp" }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(anchor).toHaveLength(0);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("WhatsApp desktop copia la imagen al portapapeles", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const { user, dialog } = await openQr(0);
    // userEvent.setup() instala su propio navigator.clipboard; se pisa después de montar.
    stubNavigator("clipboard", { write });
    vi.stubGlobal("ClipboardItem", class {
      constructor(public items: Record<string, Blob>) {}
    });
    const anchor = captureDownload();
    await user.click(within(dialog).getByRole("button", { name: "WhatsApp" }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(toast()).toMatchObject({ message: "Imagen copiada. Pégala en WhatsApp con Ctrl+V.", type: "info" });
    expect(within(dialog).getByText("Imagen copiada")).toBeInTheDocument();
    expect(anchor).toHaveLength(0);
  });

  it("Abrir WhatsApp desde el aviso abre wa.me con el mensaje del pase", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    stubNavigator("clipboard", { write });
    vi.stubGlobal("ClipboardItem", class {
      constructor(public items: Record<string, Blob>) {}
    });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user, dialog } = await openQr(0);
    await user.click(within(dialog).getByRole("button", { name: "WhatsApp" }));
    await within(dialog).findByText("Imagen copiada");
    await user.click(within(dialog).getByRole("button", { name: "Abrir WhatsApp" }));
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text="),
      "_blank",
      "noopener",
    );
    expect(within(dialog).queryByText("Imagen copiada")).toBeNull();
  });

  it("WhatsApp desktop sin permiso de portapapeles descarga la imagen", async () => {
    const write = vi.fn().mockRejectedValue(new Error("denied"));
    const { user, dialog } = await openQr(0);
    stubNavigator("clipboard", { write });
    vi.stubGlobal("ClipboardItem", class {
      constructor(public items: Record<string, Blob>) {}
    });
    const anchor = captureDownload();
    await user.click(within(dialog).getByRole("button", { name: "WhatsApp" }));
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    expect(anchor).toEqual([{ href: expect.stringMatching(/^blob:test\//), download: "pase-AXZ-1001.png" }]);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(toast()).toMatchObject({ message: "Imagen descargada. Adjúntala en WhatsApp.", type: "info" });
    expect(within(dialog).getByText("Imagen descargada")).toBeInTheDocument();
  });

  it("WhatsApp sin ClipboardItem descarga la imagen", async () => {
    const anchor = captureDownload();
    const { user, dialog } = await openQr(0);
    stubNavigator("clipboard", undefined);
    await user.click(within(dialog).getByRole("button", { name: "WhatsApp" }));
    await waitFor(() => expect(anchor).toHaveLength(1));
    expect(anchor[0].download).toBe("pase-AXZ-1001.png");
    expect(toast()).toMatchObject({ message: "Imagen descargada. Adjúntala en WhatsApp.", type: "info" });
  });

  it("WhatsApp sin imagen cae a window.open", async () => {
    passImage.blob = null;
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    stubNavigator("clipboard", undefined);
    const { user, dialog } = await openQr(0);
    await user.click(within(dialog).getByRole("button", { name: "WhatsApp" }));
    await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
    expect(openSpy.mock.calls[0][0]).toBe(`https://wa.me/?text=${encodeURIComponent("Pase de acceso CheckApp\nInvitado: Ana Pérez\nCódigo: AXZ-1001\nDestino: A-101 Casa 101\nVigencia: " + new Date(rows[0].validFrom).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) + " al " + new Date(rows[0].validUntil).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }))}`);
    expect(openSpy.mock.calls[0][1]).toBe("_blank");
    expect(openSpy.mock.calls[0][2]).toBe("noopener");
  });
});

describe("invitaciones: revocación", () => {
  it("sin motivo el botón está deshabilitado, no envía y el guard avisa", async () => {
    const update = stub("put", "/invitations/1/status");
    const { user, dialog } = await openRevoke();
    const button = within(dialog).getByRole("button", { name: "Revocar pase" }) as HTMLButtonElement;
    expect(button).toBeDisabled();
    await user.click(button);
    expect(update.method).toBe("");

    // La UI no permite llegar al guard con el botón deshabilitado; se invoca el handler de React
    // directamente para cubrir el aviso (el click real sobre un <button disabled> no dispara onClick).
    const propsKey = Object.keys(button).find((key) => key.startsWith("__reactProps$"))!;
    await act(async () => {
      (button as any)[propsKey].onClick();
    });
    await waitFor(() => expect(toast()).toMatchObject({ message: "Escribe el motivo de la revocación", type: "warning" }));
    expect(update.method).toBe("");
  });

  it("con motivo envía CANCELLED y el motivo recortado, avisa y refresca", async () => {
    const update = stub("put", "/invitations/1/status", { success: true });
    const { user, dialog, bodies } = await openRevoke();
    await user.type(within(dialog).getByLabelText("Motivo de la revocación"), "  Datos incorrectos  ");
    const n = bodies.length;
    await user.click(within(dialog).getByRole("button", { name: "Revocar pase" }));
    await waitFor(() => expect(update.body).toEqual({ status: "CANCELLED", reason: "Datos incorrectos" }));
    expect(update.path).toBe("/invitations/1/status");
    await waitFor(() => expect(toast()).toMatchObject({ message: "Estado de la invitación actualizado", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Aviso de Seguridad")).toBeNull());
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("si el API falla muestra su mensaje y deja el diálogo abierto", async () => {
    fail("put", "/invitations/1/status", ["No se puede revocar"], 400);
    const { user, dialog } = await openRevoke();
    await user.type(within(dialog).getByLabelText("Motivo de la revocación"), "Motivo");
    await user.click(within(dialog).getByRole("button", { name: "Revocar pase" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "No se puede revocar", type: "error" }));
    expect(within(dialog).getByText("Aviso de Seguridad")).toBeInTheDocument();
  });

  it("Volver cierra sin enviar", async () => {
    const update = stub("put", "/invitations/1/status");
    const { user, dialog } = await openRevoke();
    await user.type(within(dialog).getByLabelText("Motivo de la revocación"), "Motivo");
    await user.click(within(dialog).getByRole("button", { name: "Volver" }));
    await waitFor(() => expect(screen.queryByText("Aviso de Seguridad")).toBeNull());
    expect(update.method).toBe("");
  });
});

describe("invitaciones: escaneo y validación", () => {
  it("el input fuerza el prefijo AXZ-", async () => {
    const { user, input } = await openScan("Aprobar ingreso", "Validación de acceso");
    expect(input.value).toBe("AXZ-");
    await user.clear(input);
    expect(input.value).toBe("AXZ-");
    await user.type(input, "abc");
    expect(input.value).toBe("AXZ-ABC");
  });

  it("código incorrecto avisa y no envía nada", async () => {
    const update = stub("put", "/invitations/1/status");
    const { user, input, dialog } = await openScan("Aprobar ingreso", "Validación de acceso");
    await user.type(input, "9999");
    await user.click(within(dialog).getByRole("button", { name: "Autorizar acceso" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "El código insertado no coincide con este pase", type: "error" }));
    expect(update.method).toBe("");
    expect(within(dialog).getByText("Validación de acceso")).toBeInTheDocument();
  });

  it("código correcto registra ENTERED y refresca", async () => {
    const update = stub("put", "/invitations/1/status", { success: true });
    const { user, input, dialog, bodies } = await openScan("Aprobar ingreso", "Validación de acceso");
    const n = bodies.length;
    await user.type(input, "1001");
    await user.click(within(dialog).getByRole("button", { name: "Autorizar acceso" }));
    await waitFor(() => expect(update.body).toEqual({ status: "ENTERED" }));
    expect(update.path).toBe("/invitations/1/status");
    await waitFor(() => expect(toast()).toMatchObject({ message: "Pase marcado como Ingresado", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Validación de acceso")).toBeNull());
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("código correcto registra EXITED desde un pase ENTERED", async () => {
    const update = stub("put", "/invitations/2/status", { success: true });
    const { user, input, dialog } = await openScan("Aprobar salida", "Validación de salida");
    await user.type(input, "1002");
    await user.click(within(dialog).getByRole("button", { name: "Registrar salida" }));
    await waitFor(() => expect(update.body).toEqual({ status: "EXITED" }));
    expect(update.path).toBe("/invitations/2/status");
    await waitFor(() => expect(toast()).toMatchObject({ message: "Pase marcado como Módulo de Salida", type: "success" }));
  });

  it("Enter en el input también valida el pase", async () => {
    const update = stub("put", "/invitations/1/status", { success: true });
    const { user, input } = await openScan("Aprobar ingreso", "Validación de acceso");
    await user.type(input, "1001{Enter}");
    await waitFor(() => expect(update.body).toEqual({ status: "ENTERED" }));
  });

  it("error del API al validar muestra el mensaje", async () => {
    fail("put", "/invitations/1/status", ["Pase no válido"], 409);
    const { user, input, dialog } = await openScan("Aprobar ingreso", "Validación de acceso");
    await user.type(input, "1001");
    await user.click(within(dialog).getByRole("button", { name: "Autorizar acceso" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Pase no válido", type: "error" }));
    expect(within(dialog).getByText("Validación de acceso")).toBeInTheDocument();
  });

  it("error de red al validar avisa", async () => {
    server.use(http.put(`${API}/invitations/1/status`, () => HttpResponse.error()));
    const { user, input, dialog } = await openScan("Aprobar ingreso", "Validación de acceso");
    await user.type(input, "1001");
    await user.click(within(dialog).getByRole("button", { name: "Autorizar acceso" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error updating status", type: "error" }));
  });

  it("Cancelar cierra sin validar", async () => {
    const update = stub("put", "/invitations/1/status");
    const { user, dialog } = await openScan("Aprobar ingreso", "Validación de acceso");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Validación de acceso")).toBeNull());
    expect(update.method).toBe("");
  });
});
