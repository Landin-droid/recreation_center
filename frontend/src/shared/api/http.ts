import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@features/auth/model/auth-store";
import { env } from "@shared/config/env";
import type { ApiEnvelope, ApiErrorPayload } from "./types";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const authFreePaths = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
];

let refreshRequest: Promise<string | null> | null = null;

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      authFreePaths.some((path) => originalRequest.url?.includes(path))
    ) {
      throw error;
    }

    const { clearSession, refreshToken: storedRefreshToken, setSession } = useAuthStore.getState();

    originalRequest._retry = true;

    if (!refreshRequest) {
      // Запрос на обновление токенов. 
      refreshRequest = axios
        .post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
          `${env.apiBaseUrl}/auth/refresh`,
          { refreshToken: storedRefreshToken }, // Передаем явно на случай если куки не работают
          { withCredentials: true }
        )
        .then((res) => {
          const { accessToken, refreshToken } = res.data.data;
          // Обновляем токены в сторе
          const user = useAuthStore.getState().user;
          if (user) {
            setSession({ user, accessToken, refreshToken });
          }
          return accessToken;
        })
        .catch(() => {
          clearSession();
          return null;
        })
        .finally(() => {
          refreshRequest = null;
        });
    }

    const newAccessToken = await refreshRequest;

    if (!newAccessToken) {
      throw error;
    }

    // Повторяем оригинальный запрос с новым токеном
    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    }
    return http(originalRequest);
  },
);

export function extractErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Не удалось выполнить запрос"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка";
}

export async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>) {
  const response = await request;
  return response.data.data;
}
