import { useCallback, useEffect, useState } from "react";
import { getCatalogBusinessLineServiceOptions } from "../services/CatalogService";
import { ICatalogItem } from "../types/catalog.types";

export const useBusinessLineServiceCatalog = (id: number) => {
  const [data, setData] = useState<ICatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleGetCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCatalogBusinessLineServiceOptions(id);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    handleGetCatalog();
  }, [handleGetCatalog]);

  return {
    data,
    loading,
    error,
    refresh: handleGetCatalog,
  };
};
