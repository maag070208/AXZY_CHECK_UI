import { ITFlex } from "@axzydev/axzy_ui_system";
import { AppState } from "@app/core/store/store";
import { P, PermissionRequirement } from "@app/core/permissions/permissions.constants";
import { useCan } from "@app/core/permissions/useCan";
import LOGO from "@assets/logo-green.svg";
import React from "react";
import {
  FaAddressBook,
  FaBuilding,
  FaClipboardList,
  FaComments,
  FaExclamationCircle,
  FaHome,
  FaTools,
  FaLayerGroup,
  FaQrcode,
  FaShieldAlt,
  FaUser,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export interface NavLeaf {
  id: string;
  label: string;
  path: string;
  permission?: PermissionRequirement;
  icon?: React.ReactNode;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavLeaf[];
}

export interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  permission?: PermissionRequirement;
  groups?: NavGroup[];
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  isActive: boolean;
  subitems?: {
    id: string;
    label: string;
    items: {
      id: string;
      label: string;
      action?: () => void;
      isActive: boolean;
    }[];
  }[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    label: "Inicio",
    path: "/home",
    icon: <FaHome />,
  },
  {
    id: "operation",
    label: "Operación",
    icon: <FaShieldAlt />,
    groups: [
      {
        id: "monitoring",
        label: "Monitoreo",
        items: [
          { id: "guard-tracking", label: "Seguimiento", path: "/guard-tracking", permission: P.DASHBOARD_VIEW },
          { id: "locations", label: "Ubicaciones", path: "/locations", permission: P.LOCATIONS_MANAGE },
          { id: "chat", label: "Chat", path: "/chat", permission: P.CHAT_USE, icon: <FaComments /> },
        ],
      },
      {
        id: "rounds-group",
        label: "Rondas",
        items: [
          { id: "rounds", label: "Historial de recorridos", path: "/rounds", permission: P.ASSIGNMENTS_MANAGE },
          { id: "routes", label: "Rutas", path: "/routes", permission: P.RECURRING_MANAGE },
        ],
      },
      {
        id: "records",
        label: "Registros",
        items: [
          { id: "kardex", label: "Kardex", path: "/kardex", permission: P.KARDEX_VIEW },
          { id: "shift-handover", label: "Entrega de turno", path: "/shift-handover", permission: P.SHIFT_HANDOVER_MANAGE },
          { id: "access-log", label: "Bitácora de accesos", path: "/access-log", permission: P.ACCESS_EVENT_VIEW },
        ],
      },
    ],
  },
  {
    id: "residential",
    label: "Residencial",
    icon: <FaBuilding />,
    groups: [
      {
        id: "homes",
        label: "Hogares",
        items: [
          { id: "properties", label: "Propiedades", path: "/properties", permission: P.PROPERTIES_VIEW },
          { id: "residents", label: "Residentes", path: "/residents", permission: P.PROPERTIES_VIEW },
        ],
      },
      {
        id: "access",
        label: "Accesos",
        items: [
          { id: "invitations", label: "Invitaciones", path: "/invitations", permission: P.ACCESS_CHECK, icon: <FaQrcode /> },
          { id: "vehicles", label: "Vehículos", path: "/vehicles", permission: P.VEHICLE_VIEW },
        ],
      },
      {
        id: "communication",
        label: "Comunicación",
        items: [
          { id: "announcements", label: "Avisos", path: "/announcements", permission: P.ANNOUNCEMENT_VIEW },
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finanzas",
    icon: <FaWallet />,
    path: "/finance",
    permission: P.CHARGE_MANAGE,
  },
  {
    id: "reports",
    label: "Reportes",
    icon: <FaClipboardList />,
    groups: [
      {
        id: "report-types",
        label: "Tipos de reporte",
        items: [
          { id: "incidents", label: "Incidencias", path: "/incidents", permission: P.INCIDENT_VIEW, icon: <FaExclamationCircle /> },
          { id: "maintenances", label: "Mantenimientos", path: "/maintenances", permission: P.MAINTENANCE_VIEW, icon: <FaTools /> },
          { id: "club", label: "Casa Club", path: "/club", permission: P.CLUB_VIEW, icon: <FaHome /> },
          { id: "complaints", label: "Quejas", path: "/complaints", permission: P.COMPLAINT_VIEW, icon: <FaClipboardList /> },
        ],
      },
    ],
  },
  {
    id: "staff",
    label: "Personal",
    icon: <FaUsers />,
    groups: [
      {
        id: "staff-main",
        label: "Equipo",
        items: [
          { id: "guards", label: "Guardias", path: "/guards", permission: P.ASSIGNMENTS_MANAGE },
          { id: "schedule", label: "Horarios", path: "/schedules", permission: P.SCHEDULES_MANAGE },
          { id: "uniform", label: "Uniforme", path: "/uniform", permission: P.UNIFORM_MANAGE },
          { id: "users", label: "Usuarios", path: "/users", permission: P.USERS_MANAGE },
          { id: "roles", label: "Roles y permisos", path: "/roles", permission: P.USERS_MANAGE },
        ],
      },
    ],
  },
  {
    id: "my-account",
    label: "Mi cuenta",
    icon: <FaUser />,
    groups: [
      {
        id: "my-account-main",
        label: "Mi cuenta",
        items: [
          { id: "my-profile", label: "Mi perfil", path: "/resident?tab=perfil", permission: P.RESIDENT_SELF, icon: <FaUser /> },
          { id: "my-contacts", label: "Mis contactos", path: "/resident?tab=contactos", permission: P.RESIDENT_SELF, icon: <FaAddressBook /> },
          { id: "my-passes", label: "Mis pases", path: "/resident?tab=invitaciones", permission: P.INVITATION_VIEW, icon: <FaQrcode /> },
        ],
      },
    ],
  },
  {
    id: "catalogs",
    label: "Catálogos",
    path: "/catalogs",
    icon: <FaLayerGroup />,
    permission: P.CATALOGS_MANAGE,
  },
];

/**
 * Construye el menú para un conjunto de permisos. Sin `navigate` devuelve un
 * menú "de solo lectura", útil para previsualizar el sidebar de otro rol.
 */
export const buildNavigationItems = (
  hasPermission: (permission?: PermissionRequirement) => boolean,
  navigate?: (path: string) => void,
  isRouteActive?: (path: string) => boolean,
  flat = false,
): NavigationItem[] => {
  const items: NavigationItem[] = [];

  for (const section of NAV_SECTIONS) {
    // Residentes: el sidebar es una sola lista, sin acordeones ni submenús.
    if (flat && section.groups) {
      for (const group of section.groups) {
        for (const leaf of group.items) {
          if (!hasPermission(leaf.permission)) continue;
          items.push({
            id: leaf.id,
            label: leaf.label,
            icon: leaf.icon ?? section.icon,
            action: navigate ? () => navigate(leaf.path) : undefined,
            isActive: isRouteActive?.(leaf.path) ?? false,
          });
        }
      }
      continue;
    }

    if (!section.groups) {
      if (!hasPermission(section.permission)) continue;
      items.push({
        id: section.id,
        label: section.label,
        icon: section.icon,
        action: navigate ? () => navigate(section.path!) : undefined,
        isActive: isRouteActive?.(section.path!) ?? false,
      });
      continue;
    }

    const subitems = section.groups
      .map((group) => ({
        id: group.id,
        label: group.label,
        items: group.items
          .filter((leaf) => hasPermission(leaf.permission))
          .map((leaf) => ({
            id: leaf.id,
            label: leaf.label,
            action: navigate ? () => navigate(leaf.path) : undefined,
            isActive: isRouteActive?.(leaf.path) ?? false,
          })),
      }))
      .filter((group) => group.items.length > 0);

    if (!subitems.length) continue;
    items.push({
      id: section.id,
      label: section.label,
      icon: section.icon,
      isActive: subitems.some((group) => group.items.some((item) => item.isActive)),
      subitems,
    });
  }

  return items;
};

export const useNavigationItems = (): NavigationItem[] => {
  const navigate = useNavigate();
  const location = useLocation();
  const can = useCan();
  const role = useSelector((state: AppState) => state.auth.role);

  if (!role) return [];

  const isRouteActive = (path: string) => {
    const [base, query] = path.split("?");
    const pathnameOk =
      location.pathname === base || location.pathname.startsWith(base + "/");
    if (!pathnameOk) return false;
    if (!query) return true;
    const currentTab = new URLSearchParams(location.search).get("tab") ?? "perfil";
    const targetTab = new URLSearchParams(query).get("tab") ?? "perfil";
    return currentTab === targetTab;
  };

  return buildNavigationItems(
    (permission) => !permission || can(permission),
    navigate,
    isRouteActive,
    role === "RESDN" || role === "GUARD",
  );
};

// ------------- NAVBAR (legacy) -----------------
export const Navbar = () => {
  const navigationItems = useNavigationItems();

  return (
    <ITFlex className="flex flex-row space-x-4">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={item.action}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            item.isActive
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {item.label}
        </button>
      ))}
    </ITFlex>
  );
};

export const NAVBAR_LOGO = () => (
  <img src={LOGO} className="h-10 w-auto object-contain" />
);

export const SIDEBAR_LOGO = () => (
  <img src={LOGO} className="mt-5 h-[40px] flex md:hidden" />
);
