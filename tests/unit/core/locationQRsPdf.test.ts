import { describe, expect, it } from "vitest";
import { buildLocationQRsPdf } from "@app/core/utils/locationQRsPdf";

const decode = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

const locations = [
  { id: 7, name: "Puerta Norte" },
  { id: 8, name: "Alberca" },
  { id: 9, name: "Gimnasio" },
  { id: 10, name: "Salón de eventos" },
  { id: 11, name: "Casa Club" },
];

describe("locationQRsPdf", () => {
  it("genera un PDF válido con 4 QRs por página", () => {
    const text = decode(buildLocationQRsPdf(locations, "Ronda norte"));

    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("/Type /Pages");
    expect(text).toContain("/Count 2");
    expect(text).toContain("(PUERTA NORTE)");
    expect(text).toContain("(ALBERCA)");
    expect(text).toContain("(GIMNASIO)");
    expect(text).toContain("(SAL\\323N DE EVENTOS)");
    expect(text).toContain("(Ronda norte)");
    expect(text).toContain("(powered by )");
    expect(text).toContain("(axzy.dev)");
    expect(text).toContain("startxref");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    // Módulos del QR dibujados como rectángulos PDF.
    expect((text.match(/ c\n/g) ?? []).length).toBeGreaterThan(500);
  });

  it("genera una sola página vacía si no hay ubicaciones", () => {
    const text = decode(buildLocationQRsPdf([]));
    expect(text).toContain("/Count 1");
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });
});
