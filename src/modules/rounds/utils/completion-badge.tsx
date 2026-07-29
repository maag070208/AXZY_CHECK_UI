import {
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaQuestionCircle,
  type IconType,
} from "react-icons/fa";
import type { IRound } from "../services/RoundsService";

export type CompletionBadgeColor =
  | "danger"
  | "warning"
  | "success"
  | "secondary";

export type CompletionBadgeVariant = "solid" | "outline" | "subtle";

export interface CompletionBadge {
  label: string;
  color: CompletionBadgeColor;
  variant: CompletionBadgeVariant;
  icon: IconType;
  pct: number;
  completed: number;
  expected: number;
  showBar: boolean;
  barColor: string;
  roundStatus: "IN_PROGRESS" | "COMPLETED";
  roundStatusLabel: string;
  isActive: boolean;
}

const COLOR_MAP: Record<CompletionBadgeColor, string> = {
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",
  secondary: "#94A3B8",
};

export const getCompletionBadge = (round: IRound): CompletionBadge => {
  const expected = round.expectedPoints ?? 0;
  const completed = round.completedPoints ?? 0;
  const roundStatus: "IN_PROGRESS" | "COMPLETED" =
    round.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS";
  const roundStatusLabel = roundStatus === "COMPLETED" ? "FINALIZADA" : "EN CURSO";
  const isActive = roundStatus === "IN_PROGRESS";

  if (expected === 0) {
    return {
      label: "SIN PUNTOS",
      color: "secondary",
      variant: "subtle",
      icon: FaQuestionCircle,
      pct: 0,
      completed,
      expected,
      showBar: false,
      barColor: COLOR_MAP.secondary,
      roundStatus,
      roundStatusLabel,
      isActive,
    };
  }

  const pct = Math.round((completed / expected) * 100);

  if (pct <= 33) {
    return {
      label: "INCOMPLETA",
      color: "danger",
      variant: "solid",
      icon: FaExclamationCircle,
      pct,
      completed,
      expected,
      showBar: true,
      barColor: COLOR_MAP.danger,
      roundStatus,
      roundStatusLabel,
      isActive,
    };
  }

  if (pct <= 66) {
    return {
      label: "ACEPTABLE",
      color: "warning",
      variant: "solid",
      icon: FaClock,
      pct,
      completed,
      expected,
      showBar: true,
      barColor: COLOR_MAP.warning,
      roundStatus,
      roundStatusLabel,
      isActive,
    };
  }

  return {
    label: "EXCELENTE",
    color: "success",
    variant: "solid",
    icon: FaCheckCircle,
    pct,
    completed,
    expected,
    showBar: true,
    barColor: COLOR_MAP.success,
    roundStatus,
    roundStatusLabel,
    isActive,
  };
};
