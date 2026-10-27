import { Lottie } from "lottie-react";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import adminLottie from "@assets/lottie/roles/admin/checkapp-icon_lottie-admin.json";
import shiftLottie from "@assets/lottie/roles/shift/checkapp-icon_lottie-shift.json";
import guardLottie from "@assets/lottie/roles/guard/checkapp-icon_lottie-guard.json";
import resdnLottie from "@assets/lottie/roles/resdn/checkapp-icon_lottie-resdn.json";
import maintLottie from "@assets/lottie/roles/maint/checkapp-icon_lottie-maint.json";

const LOTTIES: Record<string, any> = {
  admin: adminLottie,
  jefe: shiftLottie,
  guardia: guardLottie,
  residente: resdnLottie,
  mantenimiento: maintLottie,
};

/** Loader de login con el Lottie del rol que está entrando. */
export const RoleLottieLoader = ({ role, label = "Iniciando sesión…" }: { role?: string; label?: string }) => (
  <ITFlex direction="column" align="center" justify="center" gap={3} className="text-center">
    <Lottie
      src={LOTTIES[role ?? "admin"] ?? LOTTIES.admin}
      loop
      autoplay
      style={{ width: 170, height: 170 }}
      aria-label={label}
    />
    <ITText as="p" className="text-sm font-black text-slate-800">{label}</ITText>
    <ITText as="p" className="text-[11px] font-semibold text-slate-500">Validando tus credenciales</ITText>
  </ITFlex>
);
