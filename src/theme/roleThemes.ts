import { ITThemePalette } from "@axzydev/axzy_ui_system";
import { theme as baseTheme } from "./theme";

/** Mismos colores de rol que el login y la APP. */
const ROLE_THEMES: Record<string, Partial<ITThemePalette>> = {
  ADMIN: {
    primary: "#065911",
    secondary: "#64748b",
    ternary: "#a855f7",
    table: { ...baseTheme.table, rowHover: "#e6f4ea" },
  },
  SHIFT: {
    primary: "#064E4B",
    secondary: "#64748b",
    ternary: "#14b8a6",
    table: { ...baseTheme.table, rowHover: "#e6f7f6" },
  },
  GUARD: {
    primary: "#0B2E4F",
    secondary: "#64748b",
    ternary: "#38bdf8",
    table: { ...baseTheme.table, rowHover: "#e6f2fb" },
  },
  RESDN: {
    primary: "#3B1D5A",
    secondary: "#64748b",
    ternary: "#c084fc",
    table: { ...baseTheme.table, rowHover: "#f3e8ff" },
  },
  MAINT: {
    primary: "#475569",
    secondary: "#64748b",
    ternary: "#94a3b8",
    table: { ...baseTheme.table, rowHover: "#f1f5f9" },
  },
};

export const getRoleTheme = (role?: string | null): ITThemePalette => {
  const override = ROLE_THEMES[role ?? "ADMIN"] ?? ROLE_THEMES.ADMIN;
  return {
    ...baseTheme,
    ...override,
    layout: { ...baseTheme.layout, ...override.layout },
    table: { ...baseTheme.table, ...override.table },
  };
};

export default getRoleTheme;
