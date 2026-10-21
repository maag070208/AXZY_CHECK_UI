type Listener = (msg: { name: string; data: unknown }) => void;
const listeners = new Map<string, Map<string, Listener[]>>();

/** Control del doble de Ably desde las pruebas. */
export const ablyProbe: {
  /** Opciones con las que la app construyó el cliente (incluye `authCallback`). */
  options?: { authCallback?: (params: unknown, cb: (err: unknown, token: unknown) => void) => void | Promise<void> };
  /** Si es true, `new Ably.Realtime()` lanza (simula SDK sin configurar). */
  throwOnConnect: boolean;
  /** Valor que devuelve `close()` (por defecto una promesa). */
  closeReturns: "promise" | "undefined" | "rejected";
  closed: number;
} = { throwOnConnect: false, closeReturns: "promise", closed: 0 };

/** Dispara un evento de tiempo real como si lo enviara Ably. */
export const emitAbly = (channel: string, event: string, data: unknown = {}) =>
  listeners.get(channel)?.get(event)?.forEach((fn) => fn({ name: event, data }));

export const resetAbly = () => {
  listeners.clear();
  ablyProbe.options = undefined;
  ablyProbe.throwOnConnect = false;
  ablyProbe.closeReturns = "promise";
  ablyProbe.closed = 0;
};

class FakeRealtime {
  constructor(options: typeof ablyProbe.options) {
    if (ablyProbe.throwOnConnect) throw new Error("ably no disponible");
    ablyProbe.options = options;
  }
  channels = {
    get: (name: string) => ({
      subscribe: (event: string, fn: Listener) => {
        const byEvent = listeners.get(name) ?? new Map<string, Listener[]>();
        byEvent.set(event, [...(byEvent.get(event) ?? []), fn]);
        listeners.set(name, byEvent);
      },
      unsubscribe: () => {},
      publish: () => {},
    }),
  };
  close() {
    ablyProbe.closed += 1;
    if (ablyProbe.closeReturns === "undefined") return undefined;
    if (ablyProbe.closeReturns === "rejected") return Promise.reject(new Error("x"));
    return Promise.resolve();
  }
}

/** Sustituto de la librería `ably`: sin red ni sockets. */
export const ablyModule = { default: { Realtime: FakeRealtime }, Realtime: FakeRealtime };
