import { ITFlex } from "@axzydev/axzy_ui_system";
import { P, PermissionRequirement } from "@app/core/permissions/permissions.constants";
import { useCan } from "@app/core/permissions/useCan";
import LOGO from "@assets/logo-green.svg";
import React from "react";
import {
  FaBuilding,
  FaClipboardList,
  FaHome,
  FaLayerGroup,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

export const useNavigationItems = (): any[] => {
  const navigate = useNavigate();
  const location = useLocation();
  const can = useCan();

  const isRouteActive = (path: string, subroutes?: string[]) => {
    if (subroutes?.length) {
      return subroutes.some((subroute) =>
        location.pathname.startsWith(subroute)
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  type Leaf = { id: string; label: string; path: string; permission?: PermissionRequirement };
  type Group = { id: string; label: string; items: Leaf[] };
  type Section = {
    id: string;
    label: string;
    icon: React.ReactNode;
    path?: string;
    permission?: PermissionRequirement;
    groups?: Group[];
  };

  const sections: Section[] = [
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
            { id: "chat", label: "Chat", path: "/chat", permission: P.CHAT_USE },
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
            { id: "invitations", label: "Invitaciones", path: "/invitations", permission: P.ACCESS_CHECK },
          ],
        },
      ],
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
            { id: "incidents", label: "Incidencias", path: "/incidents", permission: P.INCIDENT_VIEW },
            { id: "maintenances", label: "Mantenimientos", path: "/maintenances", permission: P.MAINTENANCE_VIEW },
            { id: "club", label: "Casa Club", path: "/club", permission: P.CLUB_VIEW },
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

  const allowed = (permission?: PermissionRequirement) =>
    !permission || can(permission);

  const items: any[] = [];
  for (const section of sections) {
    if (!section.groups) {
      if (!allowed(section.permission)) continue;
      items.push({
        id: section.id,
        label: section.label,
        icon: section.icon,
        action: () => navigate(section.path!),
        isActive: isRouteActive(section.path!),
      });
      continue;
    }

    const subitems = section.groups
      .map((group) => ({
        id: group.id,
        label: group.label,
        items: group.items
          .filter((leaf) => allowed(leaf.permission))
          .map((leaf) => ({
            id: leaf.id,
            label: leaf.label,
            action: () => navigate(leaf.path),
            isActive: isRouteActive(leaf.path),
          })),
      }))
      .filter((group) => group.items.length > 0);

    if (!subitems.length) continue;
    items.push({
      id: section.id,
      label: section.label,
      icon: section.icon,
      isActive: subitems.some((g) => g.items.some((i) => i.isActive)),
      subitems,
    });
  }

  return items;
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
