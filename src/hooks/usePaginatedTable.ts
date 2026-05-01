import { get } from "@app/core/axios/axios";
import { saveTableState } from "@app/core/store/tables/tables.slice";

import { useCallback, useEffect, useRef, useState, } from "react";
import { useDispatch } from "react-redux";

export function usePaginatedTable({
  apiUrl,
  tableKey,
  initialPage = 1,
  initialPageSize = 20,
  initialSortDescending = true,
  initialSortField = "",
  initialFilters = {},
  initialSearchTerm = "",
  saveStateToRedux = false,
}: any & {
  tableKey?: string;
  initialPage?: number;
  initialSortField?: string;
  initialSearchTerm?: string;
  saveStateToRedux?: boolean;
}): any & {
  searchTerm: string;
  handleSearchChange: (term: string) => void;
  resetTable: () => void;
} {
  const dispatch = useDispatch();
  
  const [state, setState] = useState<any>({
    items: [],
    pageIndex: initialPage,
    pageSize: initialPageSize,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
    sortField: initialSortField,
    sortDescending: initialSortDescending,
  });

  const [filters, setFilters] = useState<any>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);
  const lastSavedState = useRef<any>(null);

  // Función para guardar el estado en Redux
  const saveStateToStore = useCallback((currentState: {
    pageIndex: number;
    pageSize: number;
    sortDescending: boolean;
    sortField: string;
    searchTerm: string;
    filters: any;
  }) => {
    if (saveStateToRedux && tableKey) {
      const stateToSave = {
        tableKey,
        pageIndex: currentState.pageIndex,
        pageSize: currentState.pageSize,
        sort: currentState.sortDescending ? "desc" : "asc",
        sortField: currentState.sortField,
        filterValue: currentState.searchTerm,
        filters: currentState.filters
      };
      
      if (JSON.stringify(stateToSave) !== JSON.stringify(lastSavedState.current)) {
        lastSavedState.current = stateToSave;
        dispatch(saveTableState(stateToSave as any));
      }
    }
  }, [saveStateToRedux, tableKey, dispatch]);

  

  const fetchData = useCallback(
    async (overridePageSize?: number) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("pageIndex", String(state.pageIndex));
        params.append(
          "pageSize",
          String(overridePageSize ?? state.pageSize) 
        );
        params.append("sortDescending", String(state.sortDescending));

        if (state.sortField) {
          params.append("sortField", state.sortField);
        }

        const currentSearchTerm: any = searchTerm || filters.query || "";
        if (currentSearchTerm.trim()) {
          params.append("SearchTerm", currentSearchTerm.trim());
        }

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && key !== "query") {
            params.append(key, String(value));
          }
        });

        const url = `${apiUrl}?${params.toString()}`;
        const response = await get<any>(url, { signal });

        if (!signal.aborted) {
          if (response.success) {
            setState((prevState: any) => ({
              ...response.data,
              // Mantener el pageIndex actual en lugar de usar el de la respuesta
              pageIndex: prevState.pageIndex,
              sortField: prevState.sortField,
              sortDescending: prevState.sortDescending,
            }));
            
            saveStateToStore({
              pageIndex: state.pageIndex,
              pageSize: state.pageSize,
              sortDescending: state.sortDescending,
              sortField: state.sortField,
              searchTerm,
              filters
            });
          } else {
            setError(response.message || "Error al obtener los datos");
          }
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [
      apiUrl,
      filters,
      searchTerm,
      state.pageIndex,
      state.pageSize,
      state.sortDescending,
      state.sortField,
    ]
  );

const fetchDataWithOverride = useCallback(
  async (
    overridePageIndex?: number,
    overridePageSize?: number,
    overrideSortField?: string,
    overrideSortDescending?: boolean,
    overrideFilters?: any,
    overrideSearchTerm?: string
  ) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);

    try {
      const pageIndexToUse = overridePageIndex ?? state.pageIndex;
      const pageSizeToUse = overridePageSize ?? state.pageSize;
      const sortFieldToUse = overrideSortField ?? state.sortField;
      // FORZAR el sort descendente solo si viene undefined
      const sortDescendingToUse = overrideSortDescending !== undefined
        ? overrideSortDescending
        : state.sortDescending;

      const filtersToUse = overrideFilters ?? filters;
      const searchTermToUse = overrideSearchTerm ?? searchTerm;

      const params = new URLSearchParams();
      params.append("pageIndex", String(pageIndexToUse));
      params.append("pageSize", String(pageSizeToUse));
      params.append("sortDescending", String(sortDescendingToUse));

      if (sortFieldToUse) params.append("sortField", sortFieldToUse);

      if (searchTermToUse?.trim()) params.append("SearchTerm", searchTermToUse.trim());

      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && key !== "query") {
          params.append(key, String(value));
        }
      });

      const url = `${apiUrl}?${params.toString()}`;
      const response = await get<any>(url, { signal });

      if (!signal.aborted) {
        if (response.success) {
          // Actualizamos el estado con los valores forzados, NO el state anterior
          setState({
            ...response.data,
            pageIndex: pageIndexToUse,
            sortField: sortFieldToUse,
            sortDescending: sortDescendingToUse,
          });

          // Guardar en Redux
          if (saveStateToRedux && tableKey) {
            const stateToSave = {
              tableKey,
              pageIndex: pageIndexToUse,
              pageSize: pageSizeToUse,
              sort: sortDescendingToUse ? "desc" : "asc",
              sortField: sortFieldToUse,
              filterValue: searchTermToUse,
              filters: filtersToUse,
            };
            if (JSON.stringify(stateToSave) !== JSON.stringify(lastSavedState.current)) {
              lastSavedState.current = stateToSave;
              dispatch(saveTableState(stateToSave as any));
            }
          }
        } else {
          setError(response.message || "Error al obtener los datos");
        }
      }
    } catch (err) {
      if (!signal.aborted) setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  },
  [apiUrl, state.pageIndex, state.pageSize, state.sortField, state.sortDescending, filters, searchTerm, dispatch, saveStateToRedux, tableKey]
);

const resetTable = useCallback(() => {
  const newFilters: any = {};
  const newSearchTerm = "";
  const newPageIndex = 1;
  const newSortField = initialSortField ?? "invoiceDate";
  const newSortDescending =  true; // <-- DESC por defecto

  // Actualizamos el estado local antes de fetch
  setFilters(newFilters);
  setSearchTerm(newSearchTerm);
  setState((prev: any) => ({
    ...prev,
    pageIndex: newPageIndex,
    sortField: newSortField,
    sortDescending: newSortDescending,
  }));

  // Forzamos fetch con sortDesc = true
  fetchDataWithOverride(
    newPageIndex,
    state.pageSize,
    newSortField,
    newSortDescending,
    newFilters,
    newSearchTerm
  );
}, [fetchDataWithOverride, initialSortField, state.pageSize]);


  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchData(20); 
    } else {
      fetchData();
    }
  }, [
    fetchData, 
    state.pageIndex, 
    state.pageSize, 
    state.sortDescending, 
    state.sortField,
    searchTerm,
    filters
  ]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setState((prev: any) => ({ ...prev, pageIndex: page }));
  }, []);

  const handleItemsPerPageChange = useCallback((newPageSize: number) => {
    setState((prev: any) => ({ ...prev, pageSize: newPageSize, pageIndex: 1 }));
  }, []);

  // MODIFICACIÓN CLAVE: Mantener el pageIndex actual al cambiar el ordenamiento
  const handleSortChange = useCallback((config: { key: string; direction: "asc" | "desc" }) => {
    setState((prev: any) => ({
      ...prev,
      sortDescending: config.direction === "desc",
      sortField: config.key,
      // NO resetear pageIndex a 1, mantener el actual
    }));
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setState((prev: any) => ({ ...prev, pageIndex: 1 }));
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
    setFilters((prev: any) => ({ ...prev, query: term }));
    setState((prev: any) => ({ ...prev, pageIndex: 1 }));
  }, []);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

return {
  data: state.items,
  pageIndex: state.pageIndex,
  pageSize: state.pageSize,
  totalCount: state.totalCount,
  totalPages: state.totalPages,
  hasPreviousPage: state.hasPreviousPage,
  hasNextPage: state.hasNextPage,
  sortConfig: {
    direction: state.sortDescending ? "desc" : "asc",
    key: state.sortField,
  },
  filters,
  isLoading,
  error,
  searchTerm,
  handlePageChange,
  handleItemsPerPageChange,
  handleSortChange,
  handleFilterChange,
  handleSearchChange,
  refreshData,
  resetTable, 
};

}