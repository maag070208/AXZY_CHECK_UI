import { createSlice } from "@reduxjs/toolkit";
import { decodeToken, isExpired } from "react-jwt";

interface AuthState {
  id: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
  token: string | null;
  /** Permisos efectivos que devuelve `GET /users/me/permissions`. */
  permissions: string[] | null;
}

const initialState: AuthState = {
  id: null,
  name: null,
  email: null,
  role: null,
  token: null,
  permissions: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  selectors: {
    isAuthenticated: (state) => !!state.token,
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
        state.permissions = null;
        return;
      }

      // ✅ JWT simple y directo
      state.id = decoded.id ?? null;
      state.name = decoded.name ?? "Usuario";
      state.email = decoded.email ?? null;
      state.role = decoded.role ?? null;
      state.token = token;
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
      state.token = null;
      state.permissions = null;
    },
  },
});

export default authSlice.reducer;

export const { setAuth, setPermissions, logout } = authSlice.actions;
export const { isAuthenticated } = authSlice.selectors;
