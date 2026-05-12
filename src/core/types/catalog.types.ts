export type CatalogOptionsType = 
    | 'property_type' 
    | 'property_status' 
    | 'invitation_type' 
    | 'resident_relationship'
    | 'role'
    | 'property'
    | 'guard'
    | 'incident_category'
    | 'incident_type'
    | 'invitation_status';

export interface ICatalogItem {
    id: string | string;
    name: string;
    value: string;
}
