import { post } from "../axios/axios";
import { ITDataTableFetchParams, ITDataTableResponse } from "../types/datatable.types";
import { TResult } from "../types/TResult";

/**
 * Generic function to fetch data for the ITDataTable component.
 * @param url The endpoint URL (e.g., "/users/datatable")
 * @param params The pagination, filtering, and sorting parameters
 */
export const fetchDataTable = async <T>(
  url: string,
  params: ITDataTableFetchParams
): Promise<ITDataTableResponse<T>> => {
  const response: TResult<ITDataTableResponse<T>> = await post<ITDataTableResponse<T>>(url, params);
  
  if (response.success && response.data) {
    return response.data;
  }
  
  // Return empty structure in case of failure to prevent component crashes
  return {
    rows: [],
    total: 0
  };
};
