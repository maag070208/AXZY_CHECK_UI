import { vi } from "vitest";

type Listener = (msg: { name: string; data: unknown }) => void;
const listeners = new Map<string, Map<string, Listener[]>>();

/** Dispara un evento de tiempo real como si lo enviara Ably. */
export const emitAbly = (channel: string, event: string, data: unknown = {}) =>
  listeners.get(channel)?.get(event)?.forEach((fn) => fn({ name: event, data }));

export const resetAbly = () => listeners.clear();

class FakeRealtime {
  channels = {
    get: (name: string) => ({
      subscribe: (event: string, fn: Listener) => {
        const byEvent = listeners.get(name) ?? new Map<string, Listener[]>();
        byEvent.set(event, [...(byEvent.get(event) ?? []), fn]);
        listeners.set(name, byEvent);
      },
      unsubscribe: vi.fn(),
      publish: vi.fn(),
    }),
  };
  close() {
    return Promise.resolve();
  }
}

/** Sustituto de la librería `ably`: sin red ni sockets. */
export const ablyModule = { default: { Realtime: FakeRealtime }, Realtime: FakeRealtime };
