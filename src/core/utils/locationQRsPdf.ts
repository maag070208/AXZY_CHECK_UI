import QRCode from "qrcode";
import { buildLocationQrPayload } from "./locationQr";

export interface QRLocation {
  id: number;
  name: string;
}

/**
 * "logo"    -> QR blanco sobre cuadro verde redondeado (como el logo de CheckApp).
 * "classic" -> QR oscuro sobre blanco (maxima compatibilidad con cualquier lector).
 */
const QR_STYLE: "logo" | "classic" = "logo";

/* ---------- Layout listo para guillotina ----------
 * Cuadricula de 2 x 2 celdas pegadas, centrada en la hoja. Cada celda es un
 * rectangulo; la tarjeta redondeada va dentro con un margen blanco (CARD_PAD),
 * asi los cortes son rectos de borde a borde y un pequeno desvio de la
 * guillotina no corta la tarjeta.
 */
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const COLS = 2;
const ROWS = 2;
const PER_PAGE = COLS * ROWS;
const CELL_W = 261.64;
const CELL_H = 384;
const CARD_PAD = 6;
const CARD_W = CELL_W - CARD_PAD * 2;
const CARD_H = CELL_H - CARD_PAD * 2;
const GRID_W = CELL_W * COLS;
const GRID_H = CELL_H * ROWS;
const GRID_X = (PAGE_W - GRID_W) / 2;
const GRID_Y = (PAGE_H - GRID_H) / 2;
const HEADER_H = 64;

// Paleta (RGB 0-1)
const GREEN_A = [0.122, 0.42, 0.271]; // #1F6B45
const GREEN_B = [0.184, 0.62, 0.408]; // #2F9E68
const BRAND = "0.122 0.420 0.271"; // #1F6B45
const PANEL_GREEN = "0.110 0.470 0.300";
const INK = "0.063 0.137 0.102"; // #10231A
const MUTED = "0.365 0.435 0.396"; // #5D6F65
const SOFT = "0.541 0.604 0.569"; // #8A9A91
const BORDER = "0.812 0.855 0.827"; // #CFDAD3
const CHIP_BG = "0.910 0.957 0.929"; // #E8F4ED
const HEADER_CHIP = "0.300 0.520 0.380";
const HEADER_SOFT = "0.820 0.930 0.870";
const WHITE = "1 1 1";

/* ---------- Medidas reales de Helvetica (ASCII 32-126, por 1000 em) ---------- */

const W_REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const W_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

const glyphWidth = (char: string, bold: boolean) => {
  const table = bold ? W_BOLD : W_REGULAR;
  let code = char.charCodeAt(0);
  if (code < 32 || code > 126) {
    // Letras acentuadas miden lo mismo que su letra base.
    code = char.normalize("NFD").charCodeAt(0);
  }
  return code >= 32 && code <= 126 ? table[code - 32] : 556;
};

const textWidth = (value: string, size: number, bold = false) => {
  let total = 0;
  for (const char of value) total += glyphWidth(char, bold);
  return (total * size) / 1000;
};

const truncateToWidth = (value: string, size: number, bold: boolean, maxW: number) => {
  if (textWidth(value, size, bold) <= maxW) return value;
  let out = value;
  while (out.length > 1 && textWidth(`${out}...`, size, bold) > maxW) out = out.slice(0, -1);
  return `${out.trimEnd()}...`;
};

/** Divide en hasta 2 lineas equilibradas (minimiza la linea mas ancha). */
const balancedLines = (value: string, size: number, bold: boolean, maxW: number) => {
  if (textWidth(value, size, bold) <= maxW) return [value];
  const words = value.split(" ");
  let best: string[] | null = null;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const widest = Math.max(textWidth(a, size, bold), textWidth(b, size, bold));
    if (widest < bestWidth) {
      bestWidth = widest;
      best = [a, b];
    }
  }
  if (!best) return [truncateToWidth(value, size, bold, maxW)];
  return best.map((line) => truncateToWidth(line, size, bold, maxW));
};

/* ---------- Utilidades PDF ---------- */

const escapePdfText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, (char) => {
      const code = char.charCodeAt(0);
      return code <= 255 ? `\\${code.toString(8).padStart(3, "0")}` : "?";
    });

const roundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const k = 0.5522847498 * r;
  return [
    `${x + r} ${y} m`,
    `${x + w - r} ${y} l`,
    `${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r} c`,
    `${x + w} ${y + h - r} l`,
    `${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h} c`,
    `${x + r} ${y + h} l`,
    `${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r} c`,
    `${x} ${y + r} l`,
    `${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y} c`,
    "h",
  ].join("\n");
};

const circlePath = (cx: number, cy: number, r: number) => {
  const k = 0.5522847498 * r;
  return [
    `${cx + r} ${cy} m`,
    `${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} c`,
    `${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} c`,
    `${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} c`,
    `${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} c`,
    "h",
  ].join("\n");
};

const text = (
  font: "F1" | "F2",
  size: number,
  color: string,
  x: number,
  y: number,
  value: string,
) =>
  `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(value)}) Tj ET`;

/** Texto centrado en la tarjeta usando el ancho real de la fuente. */
const centeredText = (
  font: "F1" | "F2",
  size: number,
  color: string,
  cardX: number,
  y: number,
  value: string,
) => {
  const width = textWidth(value, size, font === "F2");
  return text(font, size, color, cardX + (CARD_W - width) / 2, y, value);
};

/* ---------- QR ---------- */

interface QRColors {
  module: string; // modulos de datos
  finder: string; // anillo y centro de los ojos
  gap: string; // hueco entre anillo y centro (color de fondo)
}

interface QRCenter {
  // Dibuja la insignia dentro de la zona despejada (lado en pt, alineado a modulos).
  draw: (cx: number, cy: number, side: number, module: number) => string;
}

/**
 * Crea el QR. Con payloads largos (candado de seguridad) el codigo se vuelve muy
 * denso; si H genera mas de version 6, se usa Q para mantenerlo mas limpio.
 */
const createQr = (value: string) => {
  const high: any = (QRCode as any).create(value, { errorCorrectionLevel: "H" });
  if (high.modules.size <= 41) return high;
  const quartile: any = (QRCode as any).create(value, { errorCorrectionLevel: "Q" });
  return quartile.modules.size < high.modules.size ? quartile : high;
};

const qrOperators = (
  value: string,
  x: number,
  y: number,
  size: number,
  quiet: number,
  colors: QRColors,
  center?: QRCenter,
) => {
  const qr = createQr(value);
  const count: number = qr.modules.size;
  const total = count + quiet * 2;
  const module = size / total;
  const originX = x + quiet * module;
  const originY = y + quiet * module;
  const inFinder = (row: number, col: number) =>
    (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7);

  // Zona central cuadrada alineada a la cuadricula: los modulos dentro no se dibujan,
  // asi no quedan puntos cortados. La insignia deja 1 modulo de margen verde.
  const mid = (count - 1) / 2;
  let clear = Math.round(count * 0.2);
  if (clear % 2 === 0) clear += 1;
  clear = Math.max(clear, 7);
  const half = (clear - 1) / 2;
  const inClear = (row: number, col: number) =>
    !!center && Math.abs(row - mid) <= half && Math.abs(col - mid) <= half;

  const parts: string[] = [`${colors.module} rg`];
  const grow = module * 0.015; // solapa minima para que no se vean rendijas entre modulos
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(row, col) || inFinder(row, col) || inClear(row, col)) continue;
      const mx = originX + col * module - grow;
      const my = originY + (count - 1 - row) * module - grow;
      parts.push(roundedRectPath(mx, my, module + grow * 2, module + grow * 2, module * 0.32));
    }
  }
  parts.push("f");

  const finder = (fx: number, fy: number) => {
    parts.push(`${colors.finder} rg`);
    parts.push(roundedRectPath(fx, fy, module * 7, module * 7, module * 2));
    parts.push("f");
    parts.push(`${colors.gap} rg`);
    parts.push(roundedRectPath(fx + module, fy + module, module * 5, module * 5, module * 1.3));
    parts.push("f");
    parts.push(`${colors.finder} rg`);
    parts.push(roundedRectPath(fx + module * 2, fy + module * 2, module * 3, module * 3, module));
    parts.push("f");
  };

  finder(originX, originY + (count - 7) * module);
  finder(originX + (count - 7) * module, originY + (count - 7) * module);
  finder(originX, originY);

  if (center) {
    const cx = originX + (count * module) / 2;
    const cy = originY + (count * module) / 2;
    parts.push(center.draw(cx, cy, clear * module, module));
  }

  return parts.join("\n");
};

/** Pin de ubicacion (forma de gota) con hueco central. */
const pinShape = (cx: number, cy: number, s: number, color: string, hole: string) => {
  const ops: string[] = [];
  ops.push(`${color} rg`);
  ops.push(circlePath(cx, cy + s * 0.18, s * 0.3));
  ops.push("f");
  ops.push(
    `${cx - s * 0.27} ${cy + s * 0.1} m ${cx + s * 0.27} ${cy + s * 0.1} l ${cx} ${cy - s * 0.42} l h f`,
  );
  ops.push(`${hole} rg`);
  ops.push(circlePath(cx, cy + s * 0.18, s * 0.11));
  ops.push("f");
  return ops.join("\n");
};

/** Insignia central del estilo "classic". */
const classicBadge = (cx: number, cy: number, side: number) =>
  [
    `${WHITE} rg`,
    roundedRectPath(cx - side / 2, cy - side / 2, side, side, side * 0.3),
    "f",
    `${PANEL_GREEN} rg`,
    roundedRectPath(cx - side * 0.4, cy - side * 0.4, side * 0.8, side * 0.8, side * 0.24),
    "f",
    pinShape(cx, cy, side * 0.6, WHITE, PANEL_GREEN),
  ].join("\n");

/** Degradado horizontal aproximado con franjas. */
const gradientHeader = (x: number, y: number, w: number, h: number) => {
  const steps = 32;
  const stripW = w / steps;
  const ops: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const c = GREEN_A.map((a, idx) => (a + (GREEN_B[idx] - a) * t).toFixed(3)).join(" ");
    ops.push(`${c} rg`);
    ops.push(`${(x + i * stripW).toFixed(2)} ${y} ${(stripW + 0.6).toFixed(2)} ${h} re f`);
  }
  return ops.join("\n");
};

/* ---------- Tarjeta (rectangular, lista para cortar) ---------- */

const cardOperators = (location: QRLocation, x: number, y: number, heading?: string) => {
  const ops: string[] = [];
  const payload = buildLocationQrPayload(location.id);

  ops.push("q");
  // Tarjeta redondeada: recorte + fondo blanco.
  ops.push(roundedRectPath(x, y, CARD_W, CARD_H, 20));
  ops.push("W n");
  ops.push(`${WHITE} rg`);
  ops.push(`${x} ${y} ${CARD_W} ${CARD_H} re f`);

  // Cabecera con degradado (a sangre, de borde a borde)
  ops.push(gradientHeader(x, y + CARD_H - HEADER_H, CARD_W, HEADER_H));

  // Wordmark "CheckApp"
  const brandY = y + CARD_H - 37;
  const checkW = textWidth("Check", 15, true);
  ops.push(text("F2", 15, WHITE, x + 20, brandY, "Check"));
  ops.push(text("F2", 15, HEADER_SOFT, x + 20 + checkW + 0.4, brandY, "App"));

  // Etiqueta "PUNTO DE ESCANEO"
  const tag = "PUNTO DE ESCANEO";
  const tagTextW = textWidth(tag, 6.2, true);
  const tagW = tagTextW + 20;
  const tagX = x + CARD_W - 20 - tagW;
  ops.push(`${HEADER_CHIP} rg`);
  ops.push(roundedRectPath(tagX, brandY - 5, tagW, 18, 9));
  ops.push("f");
  ops.push(text("F2", 6.2, WHITE, tagX + (tagW - tagTextW) / 2, brandY + 1.2, tag));

  // Panel blanco que flota sobre la cabecera (con sombra suave)
  const outer = 196;
  const outerX = x + (CARD_W - outer) / 2;
  const outerY = y + CARD_H - HEADER_H + 14 - outer;
  ops.push("0.905 0.930 0.915 rg");
  ops.push(roundedRectPath(outerX - 1, outerY - 3.5, outer + 2, outer + 2, 26));
  ops.push("f");
  ops.push("0.950 0.965 0.955 rg");
  ops.push(roundedRectPath(outerX - 2.5, outerY - 5, outer + 5, outer + 5, 28));
  ops.push("f");
  ops.push(`${WHITE} rg`);
  ops.push(roundedRectPath(outerX, outerY, outer, outer, 25));
  ops.push("f");

  if (QR_STYLE === "logo") {
    // Cuadro verde redondeado + QR blanco, como el logo.
    const inner = outer - 14;
    const innerX = outerX + 7;
    const innerY = outerY + 7;
    ops.push(`${PANEL_GREEN} rg`);
    ops.push(roundedRectPath(innerX, innerY, inner, inner, 36));
    ops.push("f");
    ops.push(
      qrOperators(
        payload,
        innerX + 4,
        innerY + 4,
        inner - 8,
        2,
        { module: WHITE, finder: WHITE, gap: PANEL_GREEN },
        {
          // Insignia blanca redondeada con pin verde (1 modulo de margen verde alrededor).
          draw: (cx, cy, side, m) => {
            const b = side - 2 * m;
            const pin = b * 0.74;
            return [
              `${WHITE} rg`,
              roundedRectPath(cx - b / 2, cy - b / 2, b, b, b * 0.3),
              "f",
              pinShape(cx, cy - pin * 0.03, pin, PANEL_GREEN, WHITE),
            ].join("\n");
          },
        },
      ),
    );
  } else {
    ops.push(
      qrOperators(
        payload,
        outerX + 10,
        outerY + 10,
        outer - 20,
        2,
        { module: INK, finder: BRAND, gap: WHITE },
        { draw: (cx, cy, side, m) => classicBadge(cx, cy, side - 2 * m) },
      ),
    );
  }

  // Nombre del punto: una linea si cabe, si no 2 lineas equilibradas.
  const nameMaxW = CARD_W - 44;
  const name = location.name.toUpperCase();
  let nameSize = 22;
  while (nameSize > 14 && textWidth(name, nameSize, true) > nameMaxW) nameSize -= 0.5;
  if (textWidth(name, nameSize, true) <= nameMaxW) {
    ops.push(centeredText("F2", nameSize, INK, x, y + 98, name));
  } else {
    const lines = balancedLines(name, 14, true, nameMaxW);
    lines.forEach((line, i) => {
      ops.push(centeredText("F2", 14, INK, x, y + 104 - i * 15.5, line));
    });
  }

  // Chip de ruta (centrado con el ancho real del texto)
  const route = truncateToWidth(
    heading?.trim() || `Ubicación #${location.id}`,
    8,
    true,
    CARD_W - 76,
  );
  const routeW = textWidth(route, 8, true);
  const chipW = routeW + 30;
  const chipX = x + (CARD_W - chipW) / 2;
  ops.push(`${CHIP_BG} rg`);
  ops.push(roundedRectPath(chipX, y + 60, chipW, 20, 10));
  ops.push("f");
  ops.push(text("F2", 8, BRAND, chipX + 15, y + 66, route));

  // Texto de ayuda: 2 lineas equilibradas y centradas
  const body = balancedLines(
    "Escanea este código para verificar el punto de control.",
    8.5,
    false,
    CARD_W - 56,
  );
  body.forEach((line, index) => {
    ops.push(centeredText("F1", 8.5, MUTED, x, y + 46 - index * 11.5, line));
  });

  // Separador punteado
  ops.push(`${BORDER} RG`);
  ops.push("0.7 w [2.5 2.5] 0 d");
  ops.push(`${x + 24} ${y + 25} m ${x + CARD_W - 24} ${y + 25} l S`);
  ops.push("[] 0 d");

  // Credito centrado (una sola unidad, ancho real)
  const lead = "powered by ";
  const brandText = "axzy.dev";
  const leadW = textWidth(lead, 6.4, false);
  const totalW = leadW + textWidth(brandText, 6.4, true);
  const startX = x + (CARD_W - totalW) / 2;
  ops.push(text("F1", 6.4, SOFT, startX, y + 12, lead));
  ops.push(text("F2", 6.4, BRAND, startX + leadW, y + 12, brandText));

  ops.push("Q");

  // Borde suave de la tarjeta (fuera del recorte para que no se corte)
  ops.push(`${BORDER} RG`);
  ops.push("0.8 w");
  ops.push(roundedRectPath(x, y, CARD_W, CARD_H, 20));
  ops.push("S");

  return ops.join("\n");
};

/** Marcas de corte fuera del area de las tarjetas (una por linea de corte). */
const cropMarks = () => {
  const offset = 6;
  const length = 14;
  const xs = Array.from({ length: COLS + 1 }, (_, i) => GRID_X + i * CELL_W);
  const ys = Array.from({ length: ROWS + 1 }, (_, i) => GRID_Y + i * CELL_H);
  const ops: string[] = ["q", "0.35 G", "0.5 w"];

  xs.forEach((cx) => {
    ops.push(`${cx.toFixed(2)} ${(GRID_Y + GRID_H + offset).toFixed(2)} m`);
    ops.push(`${cx.toFixed(2)} ${(GRID_Y + GRID_H + offset + length).toFixed(2)} l S`);
    ops.push(`${cx.toFixed(2)} ${(GRID_Y - offset).toFixed(2)} m`);
    ops.push(`${cx.toFixed(2)} ${(GRID_Y - offset - length).toFixed(2)} l S`);
  });
  ys.forEach((cy) => {
    ops.push(`${(GRID_X - offset).toFixed(2)} ${cy.toFixed(2)} m`);
    ops.push(`${(GRID_X - offset - length).toFixed(2)} ${cy.toFixed(2)} l S`);
    ops.push(`${(GRID_X + GRID_W + offset).toFixed(2)} ${cy.toFixed(2)} m`);
    ops.push(`${(GRID_X + GRID_W + offset + length).toFixed(2)} ${cy.toFixed(2)} l S`);
  });

  ops.push("Q");
  return ops.join("\n");
};

const pageContent = (pageLocations: QRLocation[], heading?: string) => {
  const commands: string[] = [];

  pageLocations.forEach((location, index) => {
    const column = index % COLS;
    const row = Math.floor(index / COLS);
    const cardX = GRID_X + column * CELL_W + CARD_PAD;
    const cardY = GRID_Y + (ROWS - 1 - row) * CELL_H + CARD_PAD;
    commands.push(cardOperators(location, cardX, cardY, heading));
  });

  commands.push(cropMarks());
  return commands.join("\n");
};

/** Construye un PDF A4 con 4 tarjetas QR por pagina, listo para guillotina. */
export const buildLocationQRsPdf = (locations: QRLocation[], heading?: string): Uint8Array => {
  const sorted = [...locations].sort((a, b) => a.name.localeCompare(b.name));
  const pages: QRLocation[][] = [];
  for (let i = 0; i < sorted.length; i += PER_PAGE) {
    pages.push(sorted.slice(i, i + PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  const contentIds = pages.map((_, index) => 6 + index * 2);

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );

  pages.forEach((pageLocations, index) => {
    const content = pageContent(pageLocations, heading);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[index]} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
};

/** Genera y descarga el PDF con los QRs de las ubicaciones. */
export const downloadLocationQRsPdf = (locations: QRLocation[], heading?: string) => {
  const bytes = buildLocationQRsPdf(locations, heading);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const slug = (heading ?? "ubicaciones")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  link.download = `QRs-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};