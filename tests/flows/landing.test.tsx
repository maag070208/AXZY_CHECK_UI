import LandingPage from "@app/modules/landing/pages/LandingPage";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const WA_BASE = "https://wa.me/526647700088?text=";
const WA_MESSAGE =
  "Hola, me gustaría recibir una cotización de CheckApp. Tengo una empresa de seguridad con ___ guardias y ___ ubicaciones.";
const WA_URL = `${WA_BASE}${encodeURIComponent(WA_MESSAGE)}`;
const DEMO_URL = "https://cfsp.axzy.dev";
const TITLE = "CheckApp — Control de rondas y seguridad en tiempo real";

const openLanding = () => renderWithProviders(<LandingPage />);

/** Input de un `ITSearchSelect` (no asocia `label`/`htmlFor`, así que se busca por `name`). */
const byName = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;

const quoteForm = (container: HTMLElement) =>
  container.querySelector<HTMLFormElement>("form.lp-quote-form")!;

const fillQuote = async (
  r: ReturnType<typeof openLanding>,
  values = {
    name: "Ana",
    company: "Seguridad Sur",
    guards: "21 a 50",
    locations: "6 a 15",
    contact: "ana@example.com",
  },
) => {
  await r.user.type(byName(r.container, "name"), values.name);
  await r.user.type(byName(r.container, "company"), values.company);
  await pickOption(r.user, byName(r.container, "guards"), values.guards);
  await pickOption(r.user, byName(r.container, "locations"), values.locations);
  await r.user.type(byName(r.container, "contact"), values.contact);
};

afterEach(() => {
  document.title = "";
});

describe("landing · render público", () => {
  it("pinta todas las secciones sin sesión", async () => {
    const { container } = openLanding();

    // Hero + nav
    expect(
      screen.getByRole("heading", { level: 1, name: /tus rondas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ecosistema operativo de seguridad · v2\.0/)).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    for (const label of ["Beneficios", "Módulos", "Pantallas", "Cómo funciona", "FAQ", "Cotización"]) {
      expect(within(nav).getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "CheckApp, ir al inicio" })).toBeInTheDocument();

    // Beneficios
    expect(
      screen.getByRole("heading", { name: "Lo que ganas cuando tus rondas son digitales." }),
    ).toBeInTheDocument();
    for (const title of [
      "Transparencia operativa",
      "Cero fraudes en rondas",
      "Operación sin internet",
      "Incidentes al instante",
      "Mantenimiento trazable",
      "Auditoría cronológica",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }

    // Comparativa antes/después
    expect(
      screen.getByRole("heading", { name: "El papel no te dice qué está pasando ahora." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin CheckApp")).toBeInTheDocument();
    expect(screen.getByText("Con CheckApp")).toBeInTheDocument();
    expect(screen.getByText("Al día siguiente")).toBeInTheDocument();
    expect(screen.getByText("En vivo")).toBeInTheDocument();

    // Módulos (tab por defecto: consola web)
    expect(
      screen.getByRole("heading", { name: "Dos interfaces. Una sola operación." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "La consola que centraliza toda tu operación" }),
    ).toBeInTheDocument();

    // Pantallas
    expect(
      screen.getByRole("heading", { name: "Pantallas reales de la operación" }),
    ).toBeInTheDocument();
    for (const title of [
      "Monitoreo en vivo",
      "Directorio de usuarios",
      "Catálogos",
      "Historial de recorridos",
    ]) {
      expect(screen.getByAltText(`Pantalla de ${title} en CheckApp`)).toBeInTheDocument();
    }

    // Cómo funciona
    expect(
      screen.getByRole("heading", { name: "Una ronda, tres pasos, cero papeleo" }),
    ).toBeInTheDocument();
    for (const title of ["Escanea el QR", "Valida GPS y evidencia", "Ve la ronda en vivo"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }

    // Personas
    expect(
      screen.getByRole("heading", { name: "Una operación, tres roles, la misma verdad." }),
    ).toBeInTheDocument();
    for (const title of ["Administración", "Jefe de turno", "Guardia"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }

    // FAQ
    expect(
      screen.getByRole("heading", { name: "Lo que suelen preguntarnos antes de empezar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("¿Necesito señal en todos los puntos?")).toBeInTheDocument();
    expect(screen.getByText("¿Cómo se cobra?")).toBeInTheDocument();

    // Cotización
    expect(
      screen.getByRole("heading", { name: "¿Listo para tomar el control de tus rondas?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cotiza tu operación" })).toBeInTheDocument();

    // Footer
    const footer = container.querySelector("footer.lp-footer") as HTMLElement;
    expect(within(footer).getByText(/© 2026 AXZY Security Suite/)).toBeInTheDocument();
    for (const link of ["Aviso de privacidad", "Términos y condiciones", "Nuestros valores"]) {
      expect(within(footer).getByRole("link", { name: link })).toHaveAttribute("target", "_blank");
    }
    expect(within(footer).getByRole("link", { name: "aamaro@axzy.dev" })).toHaveAttribute(
      "href",
      "mailto:aamaro@axzy.dev",
    );
    expect(within(footer).getByRole("link", { name: "Explorar demo" })).toHaveAttribute(
      "href",
      DEMO_URL,
    );
  });

  it("no hace ninguna petición al API", async () => {
    // MSW está en modo estricto (`onUnhandledRequest: "error"`): si la landing
    // pidiera algo, quedaría sin handler. Además se vigilan los dos transportes
    // (axios usa XHR en jsdom; `fetch` se cubre por si acaso).
    const xhrOpen = vi.spyOn(XMLHttpRequest.prototype, "open");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    openLanding();
    await screen.findByRole("heading", { level: 1, name: /tus rondas/i });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
  });

  it("cambia el título del documento al montar y lo restaura al desmontar", async () => {
    document.title = "Título previo";
    const { unmount } = openLanding();
    expect(document.title).toBe(TITLE);
    unmount();
    expect(document.title).toBe("Título previo");
  });
});

describe("landing · navegación", () => {
  it("el logo vuelve arriba con scroll suave", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo");
    const { user } = openLanding();
    await user.click(screen.getByRole("button", { name: "CheckApp, ir al inicio" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("los enlaces del nav hacen scroll a su sección", async () => {
    const { user } = openLanding();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    const toBenefits = vi.spyOn(document.getElementById("beneficios")!, "scrollIntoView");
    await user.click(within(nav).getByRole("button", { name: "Beneficios" }));
    expect(toBenefits).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    const toFaq = vi.spyOn(document.getElementById("faq")!, "scrollIntoView");
    await user.click(within(nav).getByRole("button", { name: "FAQ" }));
    expect(toFaq).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("los botones del hero bajan a cotización y a cómo funciona", async () => {
    const { user, container } = openLanding();
    const hero = container.querySelector("section.lp-hero") as HTMLElement;
    const toQuote = vi.spyOn(document.getElementById("cotizacion")!, "scrollIntoView");
    await user.click(within(hero).getByRole("button", { name: /Solicitar cotización/i }));
    expect(toQuote).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    const toSteps = vi.spyOn(document.getElementById("como-funciona")!, "scrollIntoView");
    await user.click(within(hero).getByRole("button", { name: /Ver cómo funciona/i }));
    expect(toSteps).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("abre y cierra el menú móvil, y sus enlaces cierran el menú", async () => {
    const { user } = openLanding();
    expect(document.getElementById("lp-mobile-menu")).toBeNull();

    const open = screen.getByRole("button", { name: "Abrir menú" });
    await user.click(open);
    expect(screen.getByRole("button", { name: "Cerrar menú" })).toBeInTheDocument();
    const panel = document.getElementById("lp-mobile-menu") as HTMLElement;
    expect(panel).not.toBeNull();
    expect(within(panel).getByRole("button", { name: "Módulos" })).toBeInTheDocument();

    // Cerrar con el mismo botón (ahora "Cerrar menú").
    await user.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(document.getElementById("lp-mobile-menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();

    // Volver a abrir y navegar desde el panel móvil.
    await user.click(screen.getByRole("button", { name: "Abrir menú" }));
    const reopened = document.getElementById("lp-mobile-menu") as HTMLElement;
    const toModules = vi.spyOn(document.getElementById("modulos")!, "scrollIntoView");
    await user.click(within(reopened).getByRole("button", { name: "Módulos" }));
    expect(toModules).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(document.getElementById("lp-mobile-menu")).toBeNull();
  });
});

describe("landing · módulos", () => {
  it("las tabs cambian el panel de consola web a app móvil", async () => {
    const { user } = openLanding();
    expect(
      screen.getByRole("heading", { name: "La consola que centraliza toda tu operación" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "La app que guía al guardia en cada ronda" }),
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: "App móvil" }));
    expect(
      screen.getByRole("heading", { name: "La app que guía al guardia en cada ronda" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "La consola que centraliza toda tu operación" }),
    ).toBeNull();
    expect(screen.getByText("Modo offline con sincronización automática.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Consola web" }));
    expect(
      screen.getByRole("heading", { name: "La consola que centraliza toda tu operación" }),
    ).toBeInTheDocument();
  });

  it("'Explorar demo' abre la demo en otra pestaña", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = openLanding();
    await user.click(screen.getByRole("button", { name: /Explorar demo/i }));
    expect(open).toHaveBeenCalledWith(DEMO_URL, "_blank", "noopener,noreferrer");
  });
});

describe("landing · cotización", () => {
  it("marca como requeridos los datos de contacto", async () => {
    const { container } = openLanding();
    for (const name of ["name", "company", "contact"]) {
      expect(byName(container, name)).toBeRequired();
    }
    // Los ITSearchSelect no usan `required` nativo, pero muestran el asterisco.
    expect(screen.getByText("Guardias").closest("label")).toHaveTextContent("Guardias*");
    expect(screen.getByText("Ubicaciones").closest("label")).toHaveTextContent("Ubicaciones*");
  });

  it("no envía el formulario vacío (validación nativa)", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user, container } = openLanding();
    expect(quoteForm(container).checkValidity()).toBe(false);
    await user.click(within(quoteForm(container)).getByRole("button", { name: /Solicitar cotización/i }));
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByText("Sin compromiso. No compartimos tus datos.")).toBeInTheDocument();
  });

  it("envía los datos por WhatsApp y cambia la nota", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const r = openLanding();
    await fillQuote(r);

    // Los selects reflejan la opción elegida.
    expect(byName(r.container, "guards")).toHaveValue("21 a 50");
    expect(byName(r.container, "locations")).toHaveValue("6 a 15");

    await r.user.click(within(quoteForm(r.container)).getByRole("button", { name: /Solicitar cotización/i }));

    const message = [
      "Hola, quiero cotizar CheckApp.",
      "Nombre: Ana",
      "Empresa: Seguridad Sur",
      "Guardias: 21 a 50",
      "Ubicaciones: 6 a 15",
      "Contacto: ana@example.com",
    ].join("\n");
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      `${WA_BASE}${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    expect(
      await screen.findByText(
        "Abrimos WhatsApp con tus datos. Si no se abrió, escríbenos a aamaro@axzy.dev.",
      ),
    ).toBeInTheDocument();
  });
});

describe("landing · WhatsApp", () => {
  it("los enlaces de WhatsApp del footer y del botón flotante llevan el mensaje codificado", async () => {
    openLanding();
    const fab = screen.getByRole("link", { name: "Cotizar por WhatsApp" });
    expect(fab).toHaveAttribute("href", WA_URL);
    const footer = document.querySelector("footer.lp-footer") as HTMLElement;
    expect(within(footer).getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", WA_URL);
    expect(new URL(WA_URL).searchParams.get("text")).toBe(WA_MESSAGE);
  });

  it("el botón de WhatsApp del FAQ abre el chat", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = openLanding();
    await user.click(screen.getByRole("button", { name: /Habla con un especialista/i }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(WA_URL, "_blank", "noopener,noreferrer"));
  });

  it("las 4 capturas de pantalla se muestran con su alt", async () => {
    openLanding();
    expect(screen.getByAltText("Monitoreo en vivo de CheckApp")).toBeInTheDocument();
    expect(screen.getByAltText("Pantalla de Monitoreo en vivo en CheckApp")).toBeInTheDocument();
    expect(screen.getByAltText("Pantalla de Directorio de usuarios en CheckApp")).toBeInTheDocument();
    expect(screen.getByAltText("Pantalla de Catálogos en CheckApp")).toBeInTheDocument();
    expect(screen.getByAltText("Pantalla de Historial de recorridos en CheckApp")).toBeInTheDocument();
    // Logos de cabecera y pie.
    expect(screen.getAllByAltText("CheckApp").length).toBe(2);
  });
});
