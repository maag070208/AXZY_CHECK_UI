import LandingPage from "@app/modules/landing/pages/LandingPage";
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../helpers/render";

const WA_BASE = "https://wa.me/526647700088?text=";
const WA_MESSAGE =
  "Hola, me gustaría recibir una cotización de CheckApp. Tengo una empresa de seguridad con ___ guardias y ___ ubicaciones.";
const WA_URL = `${WA_BASE}${encodeURIComponent(WA_MESSAGE)}`;
const TITLE = "CheckApp — Control de rondas y seguridad en tiempo real";

const openLanding = () => renderWithProviders(<LandingPage />);

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
    expect(screen.getByText(/Ecosistema operativo de seguridad · v2\.1/)).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    for (const label of ["Beneficios", "Módulos", "Pantallas", "Offline", "Cómo funciona", "Planes", "FAQ"]) {
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
    const compare = document.getElementById("problema") as HTMLElement;
    expect(within(compare).getByText("Al día siguiente")).toBeInTheDocument();
    expect(within(compare).getByText("En vivo")).toBeInTheDocument();

    // Módulos (tab por defecto: consola web)
    expect(
      screen.getByRole("heading", { name: "Dos interfaces. Una sola operación." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "La consola que centraliza toda tu operación" }),
    ).toBeInTheDocument();

    // Pantallas
    expect(
      screen.getByRole("heading", { name: "Una plataforma. La vista de cada rol." }),
    ).toBeInTheDocument();
    for (const title of ["Monitoreo en vivo", "Ubicaciones y QR", "Finanzas", "Vehículos"]) {
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

    // Footer
    const footer = container.querySelector("footer.lp-footer") as HTMLElement;
    expect(within(footer).getByText(/© 2026 AXZY Security Suite/)).toBeInTheDocument();
    // Los documentos legales viven en la propia app (/legal/:doc); "Nuestros valores" sigue siendo externo.
    for (const button of ["Aviso de privacidad", "Términos y condiciones", "Derechos ARCO"]) {
      expect(within(footer).getByRole("button", { name: button })).toBeInTheDocument();
    }
    expect(within(footer).getByRole("link", { name: "Nuestros valores" })).toHaveAttribute("target", "_blank");
    expect(within(footer).getByRole("link", { name: "aamaro@axzy.dev" })).toHaveAttribute(
      "href",
      "mailto:aamaro@axzy.dev",
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

  it("el hero abre el asistente y lleva a los planes", async () => {
    const { user, container } = openLanding();
    const hero = container.querySelector("section.lp-hero") as HTMLElement;
    await user.click(within(hero).getByRole("button", { name: /Solicitar cotización/i }));
    expect(screen.getByLabelText("Asistente de cotización")).toBeInTheDocument();
    await user.click(within(screen.getByLabelText("Asistente de cotización")).getByRole("button", { name: "Cerrar asistente" }));

    const toPlans = vi.spyOn(document.getElementById("planes")!, "scrollIntoView");
    await user.click(within(hero).getAllByRole("button", { name: /Ver planes/i })[0]);
    expect(toPlans).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("muestra la operación offline y los tres planes", async () => {
    openLanding();
    expect(
      screen.getByRole("heading", { name: "El WiFi se puede caer. La operación no." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Elige el plan según tu operación." }),
    ).toBeInTheDocument();
    for (const plan of ["Estándar", "Pro", "Enterprise"]) {
      expect(screen.getByRole("heading", { name: plan })).toBeInTheDocument();
    }
    expect(screen.getAllByText("Cotiza tu plan")).toHaveLength(3);
    expect(screen.getAllByText("rondas / mes")).toHaveLength(3);
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

  it("el topbar no muestra un CTA de cotización", () => {
    const { container } = openLanding();
    const header = container.querySelector("header.lp-nav") as HTMLElement;
    expect(within(header).queryByRole("button", { name: /^Cotizar/i })).toBeNull();
  });
});

describe("landing · WhatsApp", () => {
  it("el asistente A recomienda un plan y arma la cotización por WhatsApp", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = openLanding();
    await user.click(screen.getByRole("button", { name: "Abrir asistente de cotización" }));

    const panel = screen.getByLabelText("Asistente de cotización");
    expect(panel).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "1–10" }));
    await user.click(await within(panel).findByRole("button", { name: "1–100" }));
    expect(await within(panel).findByText("Recomendación de A")).toBeInTheDocument();
    expect(within(panel).getByText(/Hasta 10 guardias/)).toBeInTheDocument();

    await user.click(await within(panel).findByRole("button", { name: "Solo cotización" }));
    await user.type(await within(panel).findByLabelText("WhatsApp opcional"), "6641234567");
    await user.click(within(panel).getByRole("button", { name: "Enviar" }));
    expect(within(panel).getByText("Resumen")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: /Enviar por WhatsApp/i }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(String(open.mock.calls[0][0])).toContain("wa.me/526647700088");
    expect(String(open.mock.calls[0][0])).toContain("Est");

    const footer = document.querySelector("footer.lp-footer") as HTMLElement;
    expect(within(footer).getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", WA_URL);
    expect(new URL(WA_URL).searchParams.get("text")).toBe(WA_MESSAGE);
  });

  it("permite agendar demo y omitir el teléfono", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = openLanding();
    await user.click(screen.getByRole("button", { name: "Abrir asistente de cotización" }));

    const panel = screen.getByLabelText("Asistente de cotización");
    await user.click(within(panel).getByRole("button", { name: "1–10" }));
    await user.click(await within(panel).findByRole("button", { name: "1–100" }));
    await user.click(await within(panel).findByRole("button", { name: "Agendar demo" }));
    await user.click(await within(panel).findByRole("button", { name: "Mañana" }));
    await user.click(await within(panel).findByRole("button", { name: "Omitir" }));

    expect(within(panel).getByText(/Demo: Mañana/)).toBeInTheDocument();
    expect(within(panel).getByText(/Sin teléfono/)).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: /Enviar por WhatsApp/i }));
    expect(String(open.mock.calls[0][0])).toContain("Demo%3A%20Ma");
  });

  it("el botón de WhatsApp del FAQ abre el chat", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = openLanding();
    await user.click(screen.getByRole("button", { name: /Habla con un especialista/i }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(WA_URL, "_blank", "noopener,noreferrer"));
  });

  it("las capturas reales de WEB y APP se muestran con su alt", async () => {
    openLanding();
    expect(screen.getByAltText("Pantalla de Monitoreo en vivo en CheckApp")).toBeInTheDocument();
    expect(screen.getByAltText("Consola web de CheckApp con el monitoreo en vivo de la operación")).toBeInTheDocument();
    expect(screen.getByAltText("App del guardia en CheckApp con su ronda y accesos rápidos")).toBeInTheDocument();
    expect(
      screen.getByAltText("App del guardia con el botón Sync para revisar y enviar lo pendiente"),
    ).toBeInTheDocument();
    // Logos de cabecera y pie.
    expect(screen.getAllByAltText("CheckApp").length).toBe(2);
  });
});
