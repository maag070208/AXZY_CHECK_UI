import QRCode from "qrcode";
import { buildLocationQrPayload } from "./locationQr";

const PANEL_GREEN = "#1C784D";
const WHITE = "#FFFFFF";

const rounded = (x: number, y: number, w: number, h: number, r: number) =>
  `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${r.toFixed(2)}" fill="${WHITE}"/>`;

/**
 * QR de ubicación con la identidad de CheckApp.
 * Replica el QR de la hoja de rutas: módulos blancos redondeados, panel verde
 * redondeado, pin de marca al centro y marco blanco.
 */
export const createBrandedQrDataUrl = async (payload: string, size = 360): Promise<string> => {
  const high: any = (QRCode as any).create(payload, { errorCorrectionLevel: "H" });
  const qr = high.modules.size <= 41 ? high : (QRCode as any).create(payload, { errorCorrectionLevel: "Q" });
  const count: number = qr.modules.size;
  const quiet = 2;
  const total = count + quiet * 2;

  const outer = size * 0.94;
  const outerX = (size - outer) / 2;
  const panel = size * 0.84;
  const panelX = (size - panel) / 2;
  const qrSize = panel * 0.86;
  const module = qrSize / total;
  const originX = panelX + (panel - qrSize) / 2 + quiet * module;
  const originY = panelX + (panel - qrSize) / 2 + quiet * module;
  const grow = module * 0.015;

  const inFinder = (row: number, col: number) =>
    (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7);
  const mid = (count - 1) / 2;
  let clear = Math.round(count * 0.2);
  if (clear % 2 === 0) clear += 1;
  clear = Math.max(clear, 7);
  const half = (clear - 1) / 2;
  const inClear = (row: number, col: number) => Math.abs(row - mid) <= half && Math.abs(col - mid) <= half;

  const modules: string[] = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(row, col) || inFinder(row, col) || inClear(row, col)) continue;
      const x = originX + col * module - grow;
      const y = originY + row * module - grow;
      modules.push(rounded(x, y, module + grow * 2, module + grow * 2, module * 0.32));
    }
  }

  const finder = (x: number, y: number) => [
    rounded(x, y, module * 7, module * 7, module * 2),
    `<rect x="${(x + module).toFixed(2)}" y="${(y + module).toFixed(2)}" width="${(module * 5).toFixed(2)}" height="${(module * 5).toFixed(2)}" rx="${(module * 1.3).toFixed(2)}" fill="${PANEL_GREEN}"/>`,
    rounded(x + module * 2, y + module * 2, module * 3, module * 3, module),
  ].join("");

  const finders = [
    finder(originX, originY),
    finder(originX + (count - 7) * module, originY),
    finder(originX, originY + (count - 7) * module),
  ].join("");

  const cx = originX + (count * module) / 2;
  const cy = originY + (count * module) / 2;
  const badge = clear * module;
  const innerBadge = badge - module * 2;
  const pinR = innerBadge * 0.22;
  const pinTop = cy - pinR * 1.05;
  const pinSvg = [
    `<rect x="${(cx - innerBadge / 2).toFixed(2)}" y="${(cy - innerBadge / 2).toFixed(2)}" width="${innerBadge.toFixed(2)}" height="${innerBadge.toFixed(2)}" rx="${(innerBadge * 0.3).toFixed(2)}" fill="${WHITE}"/>`,
    `<circle cx="${cx.toFixed(2)}" cy="${pinTop.toFixed(2)}" r="${pinR.toFixed(2)}" fill="${PANEL_GREEN}"/>`,
    `<path d="M ${(cx - pinR * 0.78).toFixed(2)} ${(pinTop + pinR * 0.62).toFixed(2)} L ${cx.toFixed(2)} ${(cy + innerBadge * 0.34).toFixed(2)} L ${(cx + pinR * 0.78).toFixed(2)} ${(pinTop + pinR * 0.62).toFixed(2)} Z" fill="${PANEL_GREEN}"/>`,
    `<circle cx="${cx.toFixed(2)}" cy="${pinTop.toFixed(2)}" r="${(pinR * 0.34).toFixed(2)}" fill="${WHITE}"/>`,
  ].join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none" role="img" aria-label="QR de ubicación CheckApp">
    <defs>
      <filter id="qr-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.16"/>
      </filter>
    </defs>
    <rect x="${outerX.toFixed(2)}" y="${outerX.toFixed(2)}" width="${outer.toFixed(2)}" height="${outer.toFixed(2)}" rx="${(size * 0.075).toFixed(2)}" fill="${WHITE}" filter="url(#qr-shadow)"/>
    <rect x="${panelX.toFixed(2)}" y="${panelX.toFixed(2)}" width="${panel.toFixed(2)}" height="${panel.toFixed(2)}" rx="${(size * 0.075).toFixed(2)}" fill="${PANEL_GREEN}"/>
    <g>${modules.join("")}</g>
    <g>${finders}</g>
    ${pinSvg}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};


/** QR de una ubicación con el diseño de la hoja de rutas. */
export const createBrandedLocationQrDataUrl = async (locationId: number, size = 360): Promise<string> =>
  createBrandedQrDataUrl(buildLocationQrPayload(locationId), size);
