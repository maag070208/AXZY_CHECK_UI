import QRCode from "qrcode";

export interface PrintableLocation {
  id: number;
  name: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Imprime una hoja con el QR de cada ubicación (4 por página, con salto de página).
 * El contenido del QR es el mismo que usa la impresión individual de Ubicaciones
 * (`{ id, type: "LOCATION" }`), que es lo que lee el escáner de la app.
 * Usa un iframe oculto en vez de `window.open` para no depender de los pop-ups.
 */
export const printLocationQRs = async (locations: PrintableLocation[], heading?: string) => {
  if (!locations.length) return;

  const cards = await Promise.all(
    locations.map(async (loc, i) => {
      const dataUrl = await QRCode.toDataURL(JSON.stringify({ id: loc.id, type: "LOCATION" }), { width: 400, margin: 1 });
      return `
        <div class="card">
          <span class="num">${i + 1}</span>
          <img src="${dataUrl}" alt="QR ${escapeHtml(loc.name)}" />
          <h2>${escapeHtml(loc.name)}</h2>
          ${heading ? `<p>${escapeHtml(heading)}</p>` : ""}
        </div>`;
    }),
  );

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(heading ?? "QR de ubicaciones")}</title>
    <style>
      @page { size: A4; margin: 10mm; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, sans-serif; }
      .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
      .card { position: relative; height: 128mm; border: 2px solid #000; border-radius: 14px; padding: 10mm;
              display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
              break-inside: avoid; page-break-inside: avoid; }
      .card:nth-child(4n) { page-break-after: always; }
      .num { position: absolute; top: 8px; left: 12px; font-size: 14px; font-weight: 700; color: #666; }
      img { width: 78mm; height: 78mm; }
      h2 { font-size: 22px; margin: 8mm 0 0; word-break: break-word; }
      p { font-size: 13px; color: #555; margin: 4px 0 0; }
    </style>
  </head>
  <body><div class="sheet">${cards.join("")}</div></body>
</html>`;

  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const cleanup = () => setTimeout(() => frame.remove(), 1000);

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return cleanup();
    win.onafterprint = cleanup;
    win.focus();
    win.print();
  };
  frame.srcdoc = html;
};
