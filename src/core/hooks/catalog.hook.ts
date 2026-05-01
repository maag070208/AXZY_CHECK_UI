import { useCallback, useEffect, useState } from "react";
import { getCatalogOptions } from "../services/CatalogService";
import { CatalogOptionsType, ICatalogItem } from "../types/catalog.types";

// Global cache for catalog data
const catalogCache = new Map<CatalogOptionsType, {
  data: ICatalogItem[];
  timestamp: number;
  promise?: Promise<any>;
}>();

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useCatalog = (catalogType: CatalogOptionsType) => {
  const [data, setData] = useState<ICatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleGetCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have cached data that's still valid
      const cached = catalogCache.get(catalogType);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION && cached.data.length > 0) {
        // Use cached data
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Check if there's already a pending request for this catalog
      if (cached?.promise) {
        // Wait for the existing request to complete
        const response = await cached.promise;
        if (response.success && Array.isArray(response.data)) {
          setData(response.data);
        } else {
          setData([]);
          setError(new Error(`Failed to load ${catalogType} catalog`));
        }
        setLoading(false);
        return;
      }

      // Make new request and cache the promise
      const requestPromise = getCatalogOptions(catalogType);
      catalogCache.set(catalogType, {
        data: [],
        timestamp: now,
        promise: requestPromise
      });

      const response = await requestPromise;
      
      // Check if the response was successful and data is an array
      if (response.success && Array.isArray(response.data)) {
        setData(response.data);
        // Update cache with successful data
        catalogCache.set(catalogType, {
          data: response.data,
          timestamp: now,
        });
      } else {
        setData([]);
        setError(new Error(`Failed to load ${catalogType} catalog`));
        // Remove failed request from cache
        catalogCache.delete(catalogType);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData([]);
      // Remove failed request from cache
      catalogCache.delete(catalogType);
    } finally {
      setLoading(false);
    }
  }, [catalogType]);

  useEffect(() => {
    handleGetCatalog();
  }, [handleGetCatalog]);

  const refresh = useCallback(() => {
    // Clear cache for this catalog type and fetch fresh data
    catalogCache.delete(catalogType);
    handleGetCatalog();
  }, [catalogType, handleGetCatalog]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};

// Utility function to clear all catalog cache
export const clearCatalogCache = () => {
  catalogCache.clear();
};

// Utility function to clear specific catalog cache
export const clearSpecificCatalogCache = (catalogType: CatalogOptionsType) => {
  catalogCache.delete(catalogType);
};

export const getRenderOption = <T extends Record<string, any>>({
  catalog,
  row,
  identifier,
}: {
  catalog: ICatalogItem[];
  row: T;
  identifier: keyof T;
}): string | null => {
  if (!row[identifier]) return null;

  const item = catalog.find(
    (item) => item.id.toString() === row[identifier].toString()
  );
  return item?.value || null;
};
