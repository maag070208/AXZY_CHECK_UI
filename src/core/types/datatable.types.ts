export interface ITDataTableFetchParams {
  page: number;
  limit: number;
  filters: Record<string, string | number | boolean>;
  sort?: {
    key: string; 
    direction: "asc" | "desc";
  };
}

export interface ITDataTableResponse<T> {
  rows: T[];
  total: number;
}
