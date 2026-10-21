import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { ablyModule, resetAbly } from "./helpers/ably";
import { restoreTransport } from "./helpers/api";
import { clearCatalogCache } from "@app/core/hooks/catalog.hook";
import { installBrowserStubs } from "./helpers/browser";
import { installGoogleStub, mapsModule, resetMapProbe } from "./helpers/maps";
import { server } from "./helpers/server";

vi.mock("ably", () => ablyModule);
vi.mock("@vis.gl/react-google-maps", () => mapsModule);

// Igual que src/main.tsx.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

// Varias pantallas tienen debounce de 500 ms antes de pedir datos.
configure({ asyncUtilTimeout: 4000 });

// jsdom no trae estas APIs de navegador que usa el UI System / mapas / tablas.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

beforeEach(() => {
  installBrowserStubs();
  installGoogleStub();
});
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  document.querySelectorAll("iframe").forEach((f) => f.remove());
  clearCatalogCache();
  resetAbly();
  restoreTransport();
  resetMapProbe();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());
