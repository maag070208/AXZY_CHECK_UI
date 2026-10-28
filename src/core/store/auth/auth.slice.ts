import { createSlice } from "@reduxjs/toolkit";
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
    },
  },
});

export default authSlice.reducer;

export const { setAuth, setSession, setPermissions, logout } = authSlice.actions;
export const { isAuthenticated } = authSlice.selectors;
