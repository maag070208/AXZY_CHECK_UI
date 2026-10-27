import { ITImage } from "@axzydev/axzy_ui_system";
import { useSelector } from "react-redux";
import adminLogo from "@assets/roles/admin/checkapp-logo-horizontal-admin.svg";
import shiftLogo from "@assets/roles/shift/checkapp-logo-horizontal-shift.svg";
import guardLogo from "@assets/roles/guard/checkapp-logo-horizontal-guard.svg";
import resdnLogo from "@assets/roles/resdn/checkapp-logo-horizontal-resdn.svg";
import maintLogo from "@assets/roles/maint/checkapp-logo-horizontal-maint.svg";

const LOGOS: Record<string, string> = {
  ADMIN: adminLogo,
  SHIFT: shiftLogo,
  GUARD: guardLogo,
  RESDN: resdnLogo,
  MAINT: maintLogo,
};

interface RoleLogoProps {
  className?: string;
  alt?: string;
  invert?: boolean;
  role?: string;
}

const ROLE_KEYS: Record<string, string> = {
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

const RoleLogoImage = ({ role, className = "h-8 w-auto", alt = "CheckApp", invert = false }: RoleLogoProps) => {
  const key = ROLE_KEYS[(role ?? "admin").toLowerCase()] ?? (role ?? "ADMIN").toUpperCase();
  const src = LOGOS[key] ?? LOGOS.ADMIN;
  return (
    <ITImage
      src={src}
      alt={alt}
      fit="contain"
      className={`${className}${invert ? " role-logo-white" : ""}`}
    />
  );
};

const ConnectedRoleLogo = (props: RoleLogoProps) => {
  const authRole = useSelector((state: any) => state.auth?.role);
  const role =
    authRole ??
    (typeof window !== "undefined" ? localStorage.getItem("lastRole") : null) ??
    "ADMIN";
  return <RoleLogoImage {...props} role={role} />;
};

/**
 * Logo CheckApp por rol. Si se pasa `role`, funciona fuera del store
 * (por ejemplo, la landing pública). Sin `role`, toma la sesión de Redux.
 */
export const RoleLogo = ({ role, ...props }: RoleLogoProps) => {
  if (role) return <RoleLogoImage {...props} role={role} />;
  return <ConnectedRoleLogo {...props} />;
};
