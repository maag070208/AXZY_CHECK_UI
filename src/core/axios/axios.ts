import axios, {
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";
import { TResult } from "../types/TResult";
import { showLoader, hideLoader } from "../store/loader/loader.slice";
import { logout } from "../store/auth/auth.slice";
import store from "../store/store";

const axiosInstance = axios.create({
  baseURL: 'https://axzycheckapi-production.up.railway.app/api/v1',
  // baseURL: 'http://localhost:4444/api/v1',
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    store.dispatch(showLoader());

    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    store.dispatch(hideLoader());
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    store.dispatch(hideLoader());
    return response;
  },
  (error: AxiosError) => {
    store.dispatch(hideLoader());

    if (error.response?.status === 401) {
      store.dispatch(logout());

      if (window.location.hash !== "#/login") {
        window.location.hash = "#/login";
      }
    }

    return Promise.reject(error);
  }
);

const handleError = <T>(error: any): TResult<T> => {
  throw (error.response.data)
};

export const post = async <T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.post(url, data, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const get = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.get(url, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const patch = async <T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.patch(url, data, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const put = async <T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.put(url, data, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const remove = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.delete(url, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export { axiosInstance };
