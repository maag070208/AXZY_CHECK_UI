import QRCode from "qrcode";
import { describe, expect, it, vi } from "vitest";
import { createBrandedLocationQrDataUrl } from "@app/core/utils/brandedLocationQr";

vi.mock("qrcode", () => ({
  default: { toString: vi.fn(async () => '<svg viewBox="0 0 33 33"></svg>') },
}));

const decode = (url: string) => decodeURIComponent(url.split(",")[1]);

describe("brandedLocationQr", () => {
  it("devuelve un SVG con tarjeta verde, badge blanco y pin", async () => {
    const url = await createBrandedLocationQrDataUrl(87);
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    const svg = decode(url);
    expect(svg).toContain('fill="#FFFFFF"');
    expect(svg).toContain('fill="#0B3D2A"');
    expect(svg).toContain("<circle");
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("usa el payload firmado de CheckApp con corrección H", async () => {
    await createBrandedLocationQrDataUrl(87);
    expect(QRCode.toString).toHaveBeenCalledWith(
      expect.stringContaining('"app":"CHECKAPP"'),
      expect.objectContaining({ type: "svg", errorCorrectionLevel: "H" }),
    );
  });

  it("tolera un SVG sin viewBox", async () => {
    vi.mocked(QRCode.toString).mockResolvedValueOnce("<svg></svg>" as never);
    const url = await createBrandedLocationQrDataUrl(1);
    expect(decode(url)).toContain("<rect");
  });
});
