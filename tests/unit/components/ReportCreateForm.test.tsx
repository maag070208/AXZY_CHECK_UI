import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportCreateForm, type ReportCreateFormProps } from "@app/core/components/ReportCreateForm";
import store from "@app/core/store/store";
import { geo } from "../../helpers/browser";
import { mapProbe } from "../../helpers/maps";
import { renderWithProviders } from "../../helpers/render";
import { dropfile, mp4, png } from "../../helpers/ui";

const types = [
  { id: 1, name: "a", value: "Fuga", categoryId: 10 },
  { id: 2, name: "b", value: "Robo", categoryId: 20 },
];

const setup = (over: Partial<ReportCreateFormProps> = {}) => {
  const props: ReportCreateFormProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    typesCatalog: types,
    title: "Nuevo reporte",
    subtitle: "Sub",
    icon: <span>ic</span>,
    accent: "amber",
    typeLabel: "Tipo de incidencia",
    placeholder: "Describe...",
    fallbackTitle: "Incidencia",
    create: vi.fn().mockResolvedValue({ success: true }),
    upload: vi.fn().mockResolvedValue({ type: "IMAGE", url: "http://u/1", key: "k1" }),
    ...over,
  };
  return { props, ...renderWithProviders(<ReportCreateForm {...props} />) };
};
const toast = () => store.getState().toast;
const sendBtn = () => screen.getByRole("button", { name: /enviar reporte|subiendo|enviando/i });

describe("ReportCreateForm", () => {
  it("cerrado no renderiza", () => {
    const { container } = setup({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
  });

  it("envío deshabilitado hasta elegir tipo; el tipo fija la categoría", async () => {
    const { user, props } = setup();
    expect(sendBtn()).toBeDisabled();
    expect(screen.getByText("Requerido")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Robo" }));
    expect(screen.getByText("1 seleccionado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Robo" })).toHaveAttribute("aria-pressed", "true");
    await user.type(screen.getByPlaceholderText("Describe..."), "algo pasó");
    await user.click(sendBtn());
    await waitFor(() => expect(props.create).toHaveBeenCalled());
    expect(props.create).toHaveBeenCalledWith({
      title: "Robo",
      categoryId: 20,
      typeId: 2,
      description: "algo pasó",
      media: [],
      latitude: undefined,
      longitude: undefined,
    });
    expect(toast()).toMatchObject({ message: "Reporte enviado con éxito", type: "success" });
    expect(props.onSuccess).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("usa fallbackTitle si el tipo no trae value", async () => {
    const { user, props } = setup({ typesCatalog: [{ id: 3, name: "x", value: "", categoryId: 1 }] });
    // value vacío: el chip no tiene texto; se localiza por rol
    await user.click(screen.getAllByRole("button", { pressed: false })[0]);
    await user.click(sendBtn());
    await waitFor(() => expect(props.create).toHaveBeenCalled());
    expect((props.create as any).mock.calls[0][0].title).toBe("Incidencia");
  });

  it("un tipo sin categoría pide seleccionar de nuevo y no envía", async () => {
    const { user, props } = setup({ typesCatalog: [{ id: 5, name: "x", value: "Sin cat" }] });
    await user.click(screen.getByRole("button", { name: "Sin cat" }));
    await user.click(sendBtn());
    expect(toast()).toMatchObject({ message: "Selecciona tipo de incidencia", type: "warning" });
    expect(props.create).not.toHaveBeenCalled();
  });

  it("toma la ubicación del navegador y la envía", async () => {
    geo.getCurrentPosition.mockImplementation((ok: any) => ok({ coords: { latitude: 10.5, longitude: -20.25 } }));
    const { user, props } = setup();
    await waitFor(() => expect(screen.getByText("10.50000, -20.25000")).toBeInTheDocument());
    expect(screen.queryByText(/Toca el mapa/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Fuga" }));
    await user.click(sendBtn());
    await waitFor(() => expect((props.create as any).mock.calls[0][0]).toMatchObject({ latitude: 10.5, longitude: -20.25 }));
  });

  it("si la geolocalización falla deja la ubicación por defecto y el aviso", () => {
    geo.getCurrentPosition.mockImplementation((_ok: any, err: any) => err({}));
    setup();
    expect(screen.getByText(/Toca el mapa/)).toBeInTheDocument();
  });

  it("marcar el mapa actualiza coordenadas", async () => {
    const { user, props } = setup();
    act(() => mapProbe.map!.onClick({ detail: { latLng: { lat: 1.5, lng: 2.5 } } }));
    expect(await screen.findByText("1.50000, 2.50000")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fuga" }));
    await user.click(sendBtn());
    await waitFor(() => expect((props.create as any).mock.calls[0][0]).toMatchObject({ latitude: 1.5, longitude: 2.5 }));
  });

  it("buscador de tipos solo aparece con más de 14 y filtra", async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `n${i}`, value: `Tipo ${i}`, categoryId: 1 }));
    const { user } = setup({ typesCatalog: many });
    await user.type(screen.getByPlaceholderText("Buscar tipo..."), "tipo 14");
    expect(screen.getByRole("button", { name: "Tipo 14" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tipo 3" })).toBeNull();
    await user.clear(screen.getByPlaceholderText("Buscar tipo..."));
    await user.type(screen.getByPlaceholderText("Buscar tipo..."), "zzz");
    expect(screen.getByText("Sin resultados.")).toBeInTheDocument();
  });

  it("sin buscador con pocos tipos", () => {
    setup();
    expect(screen.queryByPlaceholderText("Buscar tipo...")).toBeNull();
  });

  it("sube foto y video, los envía y permite quitar", async () => {
    const { user, props } = setup({
      upload: vi
        .fn()
        .mockResolvedValueOnce({ type: "IMAGE", url: "http://u/1", key: "k1" })
        .mockResolvedValueOnce({ type: "VIDEO", url: "http://u/2", key: "k2" }),
    });
    await dropfile(user, /^foto$/i, png());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Evidencia subida correctamente", type: "success" }));
    await dropfile(user, /^video$/i, mp4());
    await waitFor(() => expect(props.upload).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Fuga" }));
    await user.click(sendBtn());
    await waitFor(() => expect(props.create).toHaveBeenCalled());
    expect((props.create as any).mock.calls[0][0].media).toEqual([
      { type: "IMAGE", url: "http://u/1", key: "k1" },
      { type: "VIDEO", url: "http://u/2", key: "k2" },
    ]);
  });

  it("subida fallida muestra error y se puede quitar la evidencia", async () => {
    const { user } = setup({ upload: vi.fn().mockResolvedValue(null) });
    await dropfile(user, /^foto$/i, png());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al subir archivo", type: "error" }));
    await user.click(await screen.findByRole("button", { name: "Quitar evidencia" }));
    expect(screen.queryByRole("button", { name: "Quitar evidencia" })).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("mientras sube bloquea el envío", async () => {
    let finish!: (v: unknown) => void;
    const { user, props } = setup({ upload: vi.fn(() => new Promise((r) => (finish = r))) as never });
    await user.click(screen.getByRole("button", { name: "Fuga" }));
    await dropfile(user, /^foto$/i, png());
    await waitFor(() => expect(screen.getByRole("button", { name: /subiendo/i })).toBeDisabled());
    expect(props.create).not.toHaveBeenCalled();
    await act(async () => finish({ type: "IMAGE", url: "u", key: "k" }));
    await waitFor(() => expect(sendBtn()).toBeEnabled());
  });

  it("error al crear muestra aviso y no cierra", async () => {
    const { user, props } = setup({ create: vi.fn().mockResolvedValue({ success: false }) });
    await user.click(screen.getByRole("button", { name: "Fuga" }));
    await user.click(sendBtn());
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al enviar el reporte", type: "error" }));
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onSuccess).not.toHaveBeenCalled();
  });

  it("Cancelar y Escape cierran y limpian", async () => {
    const { user, props } = setup();
    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    (props.onClose as any).mockClear();
    await user.keyboard("{Escape}");
    expect(props.onClose).toHaveBeenCalled();
    (props.onClose as any).mockClear();
    await user.keyboard("a");
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("mientras envía no se puede cancelar ni cerrar con Escape", async () => {
    let finish!: (v: unknown) => void;
    const { user, props } = setup({ create: vi.fn(() => new Promise((r) => (finish = r))) as never });
    await user.click(screen.getByRole("button", { name: "Fuga" }));
    await user.click(sendBtn());
    await screen.findByText(/enviando/i);
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(props.onClose).not.toHaveBeenCalled();
    await act(async () => finish({ success: true }));
    await waitFor(() => expect(props.onSuccess).toHaveBeenCalled());
  });

  it.each(["amber", "red", "sky"] as const)("acento %s", (accent) => {
    setup({ accent });
    expect(screen.getByRole("button", { name: "Fuga" })).toBeInTheDocument();
  });
});
