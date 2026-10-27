import { useSelector } from "react-redux";

export interface RolePalette {
  role: string;
  primary: string;
  soft: string;
  border: string;
  hero: string;
  accent: string;
  hover: string;
  softClass: string;
  primaryBgClass: string;
  primaryTextClass: string;
}

const PALETTES: Record<string, Omit<RolePalette, "role">> = {
  ADMIN: { primary: "#065911", soft: "#E8F7EF", border: "#BBF7D0", hero: "#065911", accent: "#12A36F", hover: "#e6f4ea", softClass: "bg-emerald-50", primaryBgClass: "bg-emerald-600", primaryTextClass: "text-emerald-700" },
  SHIFT: { primary: "#064E4B", soft: "#E6FFFA", border: "#99F6E4", hero: "#064E4B", accent: "#14B8A6", hover: "#e6f7f6", softClass: "bg-teal-50", primaryBgClass: "bg-teal-600", primaryTextClass: "text-teal-700" },
  GUARD: { primary: "#0B2E4F", soft: "#E0F2FE", border: "#BAE6FD", hero: "#0B2E4F", accent: "#0EA5E9", hover: "#e6f2fb", softClass: "bg-sky-50", primaryBgClass: "bg-sky-900", primaryTextClass: "text-sky-800" },
  RESDN: { primary: "#3B1D5A", soft: "#F3E8FF", border: "#DDD6FE", hero: "#3B1D5A", accent: "#A855F7", hover: "#f3e8ff", softClass: "bg-violet-50", primaryBgClass: "bg-violet-700", primaryTextClass: "text-violet-800" },
  MAINT: { primary: "#475569", soft: "#F1F5F9", border: "#CBD5E1", hero: "#334155", accent: "#64748B", hover: "#f1f5f9", softClass: "bg-slate-50", primaryBgClass: "bg-slate-600", primaryTextClass: "text-slate-700" },
};

export const useRolePalette = (): RolePalette => {
  const authRole = useSelector((state: any) => state.auth?.role);
  const role =
    (authRole ??
      (typeof window !== "undefined" ? localStorage.getItem("lastRole") : null) ??
      "ADMIN").toUpperCase();
  const palette = PALETTES[role] ?? PALETTES.ADMIN;
  return { role, ...palette };
};
