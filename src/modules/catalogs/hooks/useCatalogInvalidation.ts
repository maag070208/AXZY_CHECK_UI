import { useCallback } from 'react';
import { clearSpecificCatalogCache } from '@app/core/hooks/catalog.hook';

/**
 * @description Hook que devuelve una función para invalidar los caches
 * del hook global useCatalog luego de una mutación exitosa sobre el catálogo.
 * @returns Función invalidate().
 */
export const useCatalogInvalidation = () => {
    const invalidate = useCallback(() => {
        clearSpecificCatalogCache('incident_category');
        clearSpecificCatalogCache('incident_type');
    }, []);

    return { invalidate };
};
