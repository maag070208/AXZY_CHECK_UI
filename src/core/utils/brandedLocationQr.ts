import QRCode from "qrcode";
import { buildLocationQrPayload } from "./locationQr";

const BRAND_GREEN = "#0B3D2A";

/**
 * QR de ubicación con la identidad de CheckApp: módulos blancos sobre tarjeta
 * verde redondeada y pin de marca al centro. Mismo contenido firmado que valida
 * la app (`buildLocationQrPayload`), así que el escáner lo acepta igual.
 */
export const createBrandedLocationQrDataUrl = async (locationId: number, size = 320): Promise<string> => {
  const svg = await QRCode.toString(buildLocationQrPayload(locationId), {
    type: "svg",
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#FFFFFF", light: BRAND_GREEN },
  });

  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const dim = viewBox ? Math.min(Number(viewBox[1]), Number(viewBox[2])) : 41;
  const cx = dim / 2;
  const cy = dim / 2;
  const badge = dim * 0.2;
  const radio = badge * 0.26;
  const pinR = badge * 0.19;
  const pinY = cy - badge * 0.05;

  const pin = [
    `<rect x="${cx - badge / 2}" y="${cy - badge / 2}" width="${badge}" height="${badge}" rx="${radio}" fill="#FFFFFF"/>`,
    `<circle cx="${cx}" cy="${pinY}" r="${pinR}" fill="${BRAND_GREEN}"/>`,
    `<path d="M ${cx - pinR * 0.72} ${pinY + pinR * 0.55} L ${cx} ${pinY + pinR * 1.8} L ${cx + pinR * 0.72} ${pinY + pinR * 0.55} Z" fill="${BRAND_GREEN}"/>`,
    `<circle cx="${cx}" cy="${pinY}" r="${pinR * 0.34}" fill="#FFFFFF"/>`,
  ].join("");

  const branded = svg.replace("</svg>", `${pin}</svg>`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(branded)}`;
};
