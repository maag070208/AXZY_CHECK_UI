import dayjs from "dayjs";

type AgeTier = "green" | "yellow" | "red" | "black";

const TIER_STYLES: Record<AgeTier, { dot: string; text: string }> = {
  green: { dot: "bg-emerald-500", text: "text-emerald-600" },
  yellow: { dot: "bg-amber-400", text: "text-amber-500" },
  red: { dot: "bg-red-500", text: "text-red-600" },
  black: { dot: "bg-black", text: "text-black" },
};

/**
 * @description Calcula cuántos días lleva abierto un registro y su nivel de
 * urgencia por color: verde (0-2 días), amarillo (3-4), rojo (5-6) y negro
 * (más de 1 semana / 7+ días).
 */
const getOpenAge = (createdAt: string): { days: number; tier: AgeTier } => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
  let tier: AgeTier = "green";
  if (days >= 7) tier = "black";
  else if (days >= 5) tier = "red";
  else if (days >= 3) tier = "yellow";
  return { days, tier };
};

interface AgeBadgeProps {
  createdAt: string | Date;
}

/**
 * @description Badge con el número de días que lleva abierto un registro,
 * coloreado por urgencia (verde/amarillo/rojo/negro).
 */
export const AgeBadge = ({ createdAt }: AgeBadgeProps) => {
  const { days, tier } = getOpenAge(dayjs(createdAt).toISOString());
  const styles = TIER_STYLES[tier];
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
      <span className={`text-xs font-black ${styles.text}`}>
        {days} {days === 1 ? "día" : "días"}
      </span>
    </span>
  );
};