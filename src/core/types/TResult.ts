export type TResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { total: number; page: number; limit: number };
};
