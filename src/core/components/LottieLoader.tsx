import { Lottie } from "lottie-react";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import animationData from "@assets/lottie/checkapp-icon.json";

interface LottieLoaderProps {
  label?: string;
  hint?: string;
  size?: number;
}

/** Loader animado oficial de CheckApp para procesos que tardan más de lo normal. */
export const LottieLoader = ({ label = "Procesando…", hint, size = 132 }: LottieLoaderProps) => (
  <ITFlex direction="column" align="center" justify="center" gap={2} className="text-center">
    <Lottie
      src={animationData}
      loop
      autoplay
      style={{ width: size, height: size }}
      aria-label={label}
    />
    <ITText as="p" className="text-sm font-black text-slate-800 dark:text-slate-100">{label}</ITText>
    {hint && <ITText as="p" className="max-w-[280px] text-[11px] text-slate-500">{hint}</ITText>}
  </ITFlex>
);
