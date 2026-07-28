import { FaShieldAlt, FaTools, FaWrench, FaCogs } from 'react-icons/fa';
import { ComponentType } from 'react';

export interface CatalogTabConfig {
    key: 'INCIDENT' | 'MAINTENANCE';
    label: string;
    description: string;
    icon: ComponentType;
}

export const CATALOG_TABS: CatalogTabConfig[] = [
    {
        key: 'INCIDENT',
        label: 'Incidencias',
        description: 'Administra las categorías y tipos para reportes de incidencias.',
        icon: FaShieldAlt,
    },
    {
        key: 'MAINTENANCE',
        label: 'Mantenimiento',
        description: 'Administra las categorías y tipos para solicitudes de mantenimiento.',
        icon: FaTools,
    },
];

export const COLOR_PRESETS: { label: string; value: string }[] = [
    { label: 'Rojo', value: '#EF4444' },
    { label: 'Verde', value: '#22C55E' },
    { label: 'Azul', value: '#3B82F6' },
    { label: 'Amarillo', value: '#FACC15' },
    { label: 'Naranja', value: '#F97316' },
    { label: 'Morado', value: '#A855F7' },
    { label: 'Gris', value: '#64748B' },
    { label: 'Cyan', value: '#06B6D4' },
];

export const ICON_PRESETS = [
    { label: 'Escudo', value: 'shield-alert' },
    { label: 'Grupo', value: 'account-group' },
    { label: 'Información', value: 'information-outline' },
    { label: 'Agua', value: 'water-pump' },
    { label: 'Relámpago', value: 'lightning-bolt' },
    { label: 'Casa', value: 'home-city' },
    { label: 'Árbol', value: 'pine-tree' },
    { label: 'Caja de herramientas', value: 'toolbox' },
    { label: 'Engrane', value: 'cog' },
    { label: 'Otro', value: 'tag' },
];

export const TAB_ICONS = {
    INCIDENT: FaShieldAlt,
    MAINTENANCE: FaWrench,
} as const;

export const TAB_FALLBACK_ICON = FaCogs;
