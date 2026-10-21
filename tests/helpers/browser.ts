import { vi } from "vitest";

/** `navigator.geolocation` controlable: las pruebas fijan `geo.getCurrentPosition.mockImplementation(...)`. */
export const geo = { getCurrentPosition: vi.fn(), watchPosition: vi.fn(), clearWatch: vi.fn() };

export const installBrowserStubs = () => {
  Object.defineProperty(navigator, "geolocation", { value: geo, configurable: true });
  let n = 0;
  URL.createObjectURL = vi.fn(() => `blob:test/${++n}`);
  URL.revokeObjectURL = vi.fn();
};
