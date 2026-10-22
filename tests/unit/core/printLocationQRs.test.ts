import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { printLocationQRs } from "@app/core/utils/printLocationQRs";
import { buildLocationQrPayload } from "@app/core/utils/locationQr";

vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn(async (t: string) => `data:image/png;base64,${btoa(t)}`) } }));

describe("printLocationQRs", () => {
  let frame: HTMLIFrameElement;
  let print: ReturnType<typeof vi.fn>;
  const win: any = {};

  beforeEach(() => {
    vi.useFakeTimers();
    print = vi.fn();
    win.focus = vi.fn();
    win.print = print;
    win.onafterprint = null;
    const create = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      const el = create(tag);
      if (tag === "iframe") {
        frame = el as HTMLIFrameElement;
        Object.defineProperty(frame, "contentWindow", { value: win, configurable: true });
      }
      return el;
    }) as never);
  });
  afterEach(() => vi.useRealTimers());

  it("sin ubicaciones no hace nada", async () => {
    await printLocationQRs([]);
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("arma el documento con un QR por ubicación y escapa HTML", async () => {
    await printLocationQRs([{ id: 1, name: 'A <b>"x"</b> & y' }, { id: 2, name: "B" }], "Torre <1>");
    const html = frame.srcdoc;
    expect(html).toContain("A &lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; y");
    expect(html).toContain("<title>Torre &lt;1&gt;</title>");
    expect(html).toContain(btoa(buildLocationQrPayload(1)));
    expect(html.match(/class="card"/g)).toHaveLength(2);
    expect(html).toContain("<p>Torre &lt;1&gt;</p>");
  });

  it("sin encabezado usa el título por defecto y no pinta párrafo", async () => {
    await printLocationQRs([{ id: 1, name: "A" }]);
    expect(frame.srcdoc).toContain("<title>QR de ubicaciones</title>");
    expect(frame.srcdoc).not.toContain("<p>");
  });

  it("al cargar imprime y limpia el iframe al terminar", async () => {
    await printLocationQRs([{ id: 1, name: "A" }]);
    expect(document.body.contains(frame)).toBe(true);
    frame.onload!(new Event("load"));
    expect(win.focus).toHaveBeenCalled();
    expect(print).toHaveBeenCalled();
    win.onafterprint();
    vi.advanceTimersByTime(1000);
    expect(document.body.contains(frame)).toBe(false);
  });

  it("si no hay contentWindow limpia sin imprimir", async () => {
    await printLocationQRs([{ id: 1, name: "A" }]);
    Object.defineProperty(frame, "contentWindow", { value: null, configurable: true });
    frame.onload!(new Event("load"));
    vi.advanceTimersByTime(1000);
    expect(print).not.toHaveBeenCalled();
    expect(document.body.contains(frame)).toBe(false);
  });
});
