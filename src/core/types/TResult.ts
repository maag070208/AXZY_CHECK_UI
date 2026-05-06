export interface TResult<T> {
  success: boolean;
  data: T;
  error?: string;
}
