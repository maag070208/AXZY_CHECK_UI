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

/** Logo CheckApp con el color del rol activo (o del último rol guardado). */
export const RoleLogo = ({ className = "h-8 w-auto", alt = "CheckApp", invert = false }: { className?: string; alt?: string; invert?: boolean }) => {
  const authRole = useSelector((state: any) => state.auth?.role);
  const role = authRole ?? (typeof window !== "undefined" ? localStorage.getItem("lastRole") : null);
  const src = LOGOS[role ?? "ADMIN"] ?? LOGOS.ADMIN;

  return <ITImage src={src} alt={alt} fit="contain" className={`${className}${invert ? " brightness-0 invert" : ""}`} />;
};
