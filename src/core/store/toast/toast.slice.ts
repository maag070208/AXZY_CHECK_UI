import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ToastState {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
  isVisible: boolean;
}

const initialState: ToastState = {
  message: "",
  type: "info",
  duration: 3000,
  position: "top-right",
  isVisible: false,
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<Omit<ToastState, "isVisible">>) => {
      state.message = action.payload.message;
      state.type = action.payload.type;
      state.duration = action.payload.duration || 1500;
      state.position = action.payload.position || "top-right";
      state.isVisible = true;
    },
    hideToast: (state) => {
      state.isVisible = false;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;

export default toastSlice.reducer;