import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { decodeToken, isExpired } from "react-jwt";
import { IDecodedToken } from "@app/core/types/auth.types";

interface AuthState {
  id: number | null;
  name: string | null;
  lastName: string | null;
  username: string | null;
  role: string | null;
  token: string | null;
}

const initialState: AuthState = {
  id: null,
  name: null,
  lastName: null,
  username: null,
  role: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  selectors: {
    isAuthenticated: (state) => !!state.token,
  },
  reducers: {
    setAuth: (state, action: PayloadAction<string>) => {
      const token = action.payload;
      const decoded = decodeToken<IDecodedToken>(token);
      const expired = isExpired(token);

      if (!decoded || expired) {
        Object.assign(state, initialState);
        return;
      }

      state.id = decoded.id;
      state.name = decoded.name;
      state.lastName = decoded.lastName;
      state.username = decoded.username;
      state.role = decoded.role;
      state.token = token;
    },

    logout: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export default authSlice.reducer;

export const { setAuth, logout } = authSlice.actions;
export const { isAuthenticated } = authSlice.selectors;
