export type CatalogType = 'INCIDENT' | 'MAINTENANCE' | 'CASA_CLUB';

export interface IncidentCategory {
    id: number;
    name: string;
    value: string;
    color: string | null;
    icon: string | null;
    type: CatalogType;
    active: boolean;
}

export interface IncidentType {
    id: number;
    name: string;
    value: string;
    categoryId: number;
    active: boolean;
}

export interface CreateCategoryInput {
    name: string;
    value: string;
    color?: string | null;
    icon?: string | null;
    type: CatalogType;
}

export interface UpdateCategoryInput {
    name?: string;
    value?: string;
    color?: string | null;
    icon?: string | null;
    type?: CatalogType;
}

export interface CreateTypeInput {
    name: string;
    value: string;
    categoryId: number;
}

export interface UpdateTypeInput {
    name?: string;
    value?: string;
    categoryId?: number;
}
