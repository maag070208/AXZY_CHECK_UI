export const ROLES = {
  ADMIN: "ADMIN",
  GUARD: "GUARD",
  SHIFT: "SHIFT",
  MAINT: "MAINT",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: "Administrador",
  [ROLES.GUARD]: "Guardia",
  [ROLES.SHIFT]: "Jefe de Guardia",
  [ROLES.MAINT]: "Mantenimiento",
};
