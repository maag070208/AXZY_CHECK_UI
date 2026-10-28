import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "../helpers/render";
import { LEGAL_KEYS, LEGAL_DOCS } from "@app/modules/legal/legal.config";
import { parseMarkdown } from "@app/modules/legal/components/parseMarkdown";

describe("información legal pública (WEB)", () => {
  it("sin sesión, /legal/privacidad muestra el aviso y el menú de documentos", async () => {
    renderApp({ route: "/legal/privacidad" });
    expect(await screen.findByRole("heading", { name: /Aviso de privacidad integral/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Documentos legales" })).toBeInTheDocument();
    expect(screen.getAllByText(/Pendiente:/).length).toBeGreaterThan(0);
  });

  it("con sesión también se puede consultar", async () => {
    renderApp({ route: "/legal/arco", role: "ADMIN" });
    expect(await screen.findByRole("heading", { name: /derechos ARCO/i })).toBeInTheDocument();
  });

  it("un documento inexistente pide elegir uno, sin romper", async () => {
    renderApp({ route: "/legal/no-existe" });
    expect(await screen.findByText("Elige un documento")).toBeInTheDocument();
  });

  it("los cinco documentos se interpretan sin dejar marcas de markdown sueltas", () => {
    for (const key of LEGAL_KEYS) {
      const blocks = parseMarkdown(LEGAL_DOCS[key].source);
      expect(blocks.length).toBeGreaterThan(3);
      const texts = blocks.flatMap((b) => (b.t === "p" || b.t === "quote" || b.t === "h" ? [b.text] : []));
      expect(texts.some((t) => t.startsWith("##"))).toBe(false);
    }
  });
});
