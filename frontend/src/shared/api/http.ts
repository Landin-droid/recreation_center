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
  // При использовании HttpOnly кук, нам не нужно вручную добавлять заголовок Authorization.
  // Браузер сам прикрепит куки к запросу благодаря withCredentials: true.
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

    const { clearSession } = useAuthStore.getState();

    originalRequest._retry = true;

    if (!refreshRequest) {
      // Запрос на обновление токенов. Сервер обновит куки в ответе.
      refreshRequest = axios
        .post<ApiEnvelope<unknown>>(
          `${env.apiBaseUrl}/auth/refresh`,
          {}, // Тело пустое, так как refresh-токен в куках
          { withCredentials: true }
        )
        .then(() => {
          return "ok";
        })
        .catch(() => {
          clearSession();
          return null;
        })
        .finally(() => {
          refreshRequest = null;
        });
    }

    const refreshStatus = await refreshRequest;

    if (!refreshStatus) {
      throw error;
    }

    // Повторяем оригинальный запрос, куки прикрепятся автоматически
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
