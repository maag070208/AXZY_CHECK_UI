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
import { readPersistedClientSelection } from "../store/tenant/tenant.storage";

type SessionConfig = InternalAxiosRequestConfig & { _retry?: boolean; skipAuth?: boolean };

const axiosInstance = axios.create({
  withCredentials: true,
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:4444/api/v1',
});
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    store.dispatch(showLoader());

    const state = store.getState();
    const token = state.auth.token;

    if (token && !(config as SessionConfig).skipAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Fase 3: ADMIN/MAINT eligen cliente con el selector global; su alcance
    // viaja en X-Client-Id. El resto de roles lo tiene fijado en el token y
    // mandar el encabezado les daría 403, así que nunca se agrega.
    const choosesClient = state.auth.role === "ADMIN" || state.auth.role === "MAINT";
    if (choosesClient) {
      // Durante el arranque el slice aún no cargó los clientes: se usa la
      // selección persistida para que las primeras peticiones ya lleven el
      // cliente correcto (el token no basta cuando la organización tiene varios).
      const selectedClientId = state.tenant.selectedClientId ?? readPersistedClientSelection(state.auth.id);
      if (selectedClientId !== null) {
        config.headers["X-Client-Id"] = String(selectedClientId);
      }
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
  async (error: AxiosError) => {
    store.dispatch(hideLoader());

    const config = error.config as SessionConfig | undefined;
    const url = String(config?.url ?? "");
    if (error.response?.status === 401 && config && !config._retry && !url.includes("/users/refresh") && !url.includes("/users/login")) {
      config._retry = true;
      try {
        // El refresh viaja en cookie HttpOnly; el access nuevo también queda en cookie.
        await axios.post(`${axiosInstance.defaults.baseURL}/users/refresh`, {}, { withCredentials: true });
        config.skipAuth = true;
        return axiosInstance(config);
      } catch {
        // Sin refresh válido, se cierra la sesión local.
      }
    }

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
