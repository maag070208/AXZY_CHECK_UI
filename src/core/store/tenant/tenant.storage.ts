/**
 * Persistencia del cliente elegido por usuarios ADMIN/MAINT. La clave incluye
 * el id del usuario para que dos cuentas en el mismo navegador no compartan
 * selección. Se borra al cerrar sesión (ver `tenant.listener.ts`).
 */
const STORAGE_PREFIX = "checkapp:tenant:client";

export const tenantStorageKey = (userId: number | string) => `${STORAGE_PREFIX}:${userId}`;

const readRaw = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    // Navegadores con almacenamiento bloqueado: la selección vive solo en memoria.
    return null;
  }
};

export const readPersistedClientSelection = (userId?: number | null): number | null => {
  if (userId === null || userId === undefined) return null;
  const raw = readRaw(tenantStorageKey(userId));
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const persistClientSelection = (userId: number, clientId: number): void => {
  try {
    localStorage.setItem(tenantStorageKey(userId), String(clientId));
  } catch {
    // Sin almacenamiento la selección sigue funcionando durante la sesión.
  }
};

export const clearPersistedClientSelection = (userId: number): void => {
  try {
    localStorage.removeItem(tenantStorageKey(userId));
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
};
