import { ITThemeConfig } from "@axzydev/axzy_ui_system";

export const theme: ITThemeConfig = {
  colors: {
    primary: {
      50:  "#e6f4ea",
      100: "#cce9d5",
      200: "#99d3ab",
      300: "#66bd81",
      400: "#33a757",
      500: "#1f8a3a",
      600: "#18702f",
      700: "#115724",
      800: "#0b3d18",
      900: "#065911", // BASE
      950: "#032d08",
    },

    success: {
      50:  "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22",
    },

    danger: {
      50:  "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
      950: "#450a0a",
    },

    warning: {
      50:  "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
      950: "#451a03",
    },

    info: {
      50:  "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
      950: "#083344",
    },

    purple: {
      50:  "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
      800: "#6b21a8",
      900: "#581c87",
      950: "#3b0764",
    },
  },

  calendar: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",

    header: {
      textColor: "#065911",
      hoverBackground: "#e6f4ea",
    },

    days: {
      textColor: "#111827",
      weekendColor: "#065911",
      outsideMonthColor: "#9ca3af",
    },

    selection: {
      selectedColor: "#ffffff",
      selectedBackground: "#065911",
      rangeBackground: "#cce9d5",
      todayBackground: "#e6f4ea",
      todayColor: "#065911",
    },
  },

  layout: {
    backgroundColor: "#f9fafb", // gris claro para mejor contraste
    contentPadding: "1.5rem",
  },
};