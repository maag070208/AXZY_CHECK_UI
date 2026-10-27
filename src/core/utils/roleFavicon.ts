import adminIcon from "@assets/roles/admin/checkapp-icon-admin.svg";
import shiftIcon from "@assets/roles/shift/checkapp-icon-shift.svg";
import guardIcon from "@assets/roles/guard/checkapp-icon-guard.svg";
import resdnIcon from "@assets/roles/resdn/checkapp-icon-resdn.svg";
import maintIcon from "@assets/roles/maint/checkapp-icon-maint.svg";

const ICONS: Record<string, string> = {
  ADMIN: adminIcon,
  SHIFT: shiftIcon,
  GUARD: guardIcon,
  RESDN: resdnIcon,
  MAINT: maintIcon,
};

const KEYS: Record<string, string> = {
  admin: "ADMIN",
  jefe: "SHIFT",
  shift: "SHIFT",
  guardia: "GUARD",
  guard: "GUARD",
  residente: "RESDN",
  resident: "RESDN",
  resdn: "RESDN",
  mantenimiento: "MAINT",
  maint: "MAINT",
};

/** Cambia el favicon del navegador al icono del rol activo. */
export const setRoleFavicon = (role?: string | null) => {
  if (typeof document === "undefined") return;
  const key = KEYS[(role ?? "admin").toLowerCase()] ?? "ADMIN";
  const href = ICONS[key] ?? ICONS.ADMIN;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = href;
};
