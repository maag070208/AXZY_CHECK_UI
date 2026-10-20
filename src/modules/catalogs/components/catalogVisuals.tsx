import type { ComponentType } from "react";
import {
  MdApartment,
  MdCategory,
  MdGroups,
  MdHandyman,
  MdHomeWork,
  MdPark,
  MdShield,
  MdWarning,
  MdWaterDrop,
} from "react-icons/md";
import { FaTools, FaUmbrellaBeach } from "react-icons/fa";
import { FaTriangleExclamation } from "react-icons/fa6";
import type { CatalogAdminType } from "../services/CatalogAdminService";

type IconComponent = ComponentType<{ size?: number; className?: string }>;

type CatalogMeta = {
  label: string;
  shortLabel: string;
  singular: string;
  plural: string;
  description: string;
  accent: string;
  icon: IconComponent;
};

/** Copy and visual identity for the three catalogs managed by this screen. */
export const CATALOG_META: Record<CatalogAdminType, CatalogMeta> = {
  INCIDENT: {
    label: "Incidencias",
    shortLabel: "Incidencias",
    singular: "incidencia",
    plural: "incidencias",
    description: "Reportes de seguridad, convivencia y servicios.",
    accent: "#EF4444",
    icon: FaTriangleExclamation,
  },
  MAINTENANCE: {
    label: "Mantenimiento",
    shortLabel: "Mantenimiento",
    singular: "mantenimiento",
    plural: "mantenimientos",
    description: "Trabajos preventivos y correctivos del condominio.",
    accent: "#0EA5E9",
    icon: FaTools,
  },
  CASA_CLUB: {
    label: "Casa Club",
    shortLabel: "Casa Club",
    singular: "registro de Casa Club",
    plural: "registros de Casa Club",
    description: "Actividades, reservas y servicios de Casa Club.",
    accent: "#8B5CF6",
    icon: FaUmbrellaBeach,
  },
};

export const CATALOG_ORDER: CatalogAdminType[] = ["INCIDENT", "MAINTENANCE", "CASA_CLUB"];

/** Icons come from the API as MaterialCommunityIcons names (shared with the APP). */
const CATEGORY_ICONS: Record<string, IconComponent> = {
  alert: MdWarning,
  "alert-circle": MdWarning,
  "shield-alert": MdShield,
  "account-group": MdGroups,
  "lightning-bolt": MdHandyman,
  "home-city": MdApartment,
  toolbox: MdHandyman,
  "pine-tree": MdPark,
  "water-pump": MdWaterDrop,
  "home-modern": MdHomeWork,
};

export const getCategoryIcon = (icon?: string | null): IconComponent =>
  (icon && CATEGORY_ICONS[icon]) || MdCategory;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const isHexColor = (color?: string | null): color is string =>
  typeof color === "string" && HEX_COLOR.test(color);

/** Category color with the catalog tone as fallback. */
export const getCategoryColor = (color: string | null | undefined, type: string): string => {
  if (isHexColor(color)) return color;
  return (CATALOG_META[type as CatalogAdminType] ?? CATALOG_META.INCIDENT).accent;
};

/** Soft background/border derived from the category color (12% / 22% alpha). */
export const getCategoryTint = (color: string) => ({
  backgroundColor: `${color}1F`,
  borderColor: `${color}38`,
  color,
});

/** Lowercase, accent-insensitive text for search matches. */
export const normalizeSearch = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;

export const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");
