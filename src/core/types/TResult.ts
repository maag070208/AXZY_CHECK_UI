export interface TResult<T> {
  data: T;
  success: boolean;
  message: string;
  messages: string[];
  ex: any;
}
