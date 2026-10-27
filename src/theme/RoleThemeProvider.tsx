import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import { getRoleTheme } from "./roleThemes";

/** Toma el rol autenticado y aplica su paleta a todo el UI System. */
export const RoleThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const role = useSelector((state: any) => state.auth?.role) ?? (typeof window !== "undefined" ? localStorage.getItem("lastRole") : null);
  const theme = useMemo(() => getRoleTheme(role), [role]);

  return (
    <ITThemeProvider theme={theme} showFab={false} density={0.9} appearance="flat">
      {children}
    </ITThemeProvider>
  );
};
