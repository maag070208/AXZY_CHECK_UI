import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { decodeToken, isExpired } from "react-jwt";

interface AuthState {
  id: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
  photoUrl: string | null;
  token: string | null;
  /** Sesión válida por cookie HttpOnly; no implica guardar el JWT en el navegador. */
  session: boolean;
  /** Permisos efectivos que devuelve `GET /users/me/permissions`. */
  permissions: string[] | null;
  /**
   * Cliente del alcance para roles con cliente fijo (GUARD/SHIFT/RESDN/CLIENT).
   * Lo entrega `GET /users/me`; el token del login todavía no lo trae.
   */
  clientId: number | null;
  /** Organización del alcance; también viene de `GET /users/me`. */
  organizationId: number | null;
}

export interface SessionScopePayload {
  clientId?: number | null;
  organizationId?: number | null;
}

const initialState: AuthState = {
  id: null,
  name: null,
  email: null,
  role: null,
  photoUrl: null,
  token: null,
  session: false,
  permissions: null,
  clientId: null,
  organizationId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  selectors: {
    isAuthenticated: (state) => state.session || !!state.token,
  },
  reducers: {
    setAuth: (state, action) => {
      const token = action.payload;
      const decoded: any = decodeToken(token);
      const expired = isExpired(token);
      if (!decoded || expired) {
        state.id = null;
        state.name = null;
        state.email = null;
        state.role = null;
        state.token = null;
        state.session = false;
        state.permissions = null;
        state.clientId = null;
        state.organizationId = null;
        return;
      }

      // ✅ JWT simple y directo
      state.id = decoded.id ?? null;
      state.name = decoded.name ?? "Usuario";
      state.email = decoded.email ?? null;
      state.role = decoded.role ?? null;
      state.photoUrl = decoded.photoUrl ?? null;
      state.token = token;
      state.session = true;
      state.permissions = null;
      // El token no trae el alcance; se completa con `GET /users/me` (multicliente).
      state.clientId = null;
      state.organizationId = null;
    },

    /** Restaura la sesión desde la cookie HttpOnly (`GET /users/me`). */
    setSession: (state, action) => {
      const user = action.payload ?? {};
      state.id = user.id ?? null;
      state.name = user.name ?? "Usuario";
      state.email = user.email ?? null;
      state.role = user.role ?? null;
      state.photoUrl = user.photoUrl ?? null;
      state.token = null;
      state.session = !!user.id;
      state.permissions = null;
      state.clientId = user.clientId ?? null;
      state.organizationId = user.organizationId ?? null;
    },

    /** Completa el alcance de una sesión iniciada con token (login reciente). */
    setSessionScope: (state, action: PayloadAction<SessionScopePayload>) => {
      if ("clientId" in action.payload) state.clientId = action.payload.clientId ?? null;
      if ("organizationId" in action.payload) state.organizationId = action.payload.organizationId ?? null;
    },

    setPermissions: (state, action) => {
      state.permissions = Array.isArray(action.payload) ? action.payload : [];
    },

    logout: (state) => {
      state.id = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.photoUrl = null;
      state.token = null;
      state.session = false;
      state.permissions = null;
      state.clientId = null;
      state.organizationId = null;
    },
  },
});

export default authSlice.reducer;

export const { setAuth, setSession, setSessionScope, setPermissions, logout } = authSlice.actions;
export const { isAuthenticated } = authSlice.selectors;
