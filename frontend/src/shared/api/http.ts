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
  "/users/login",
  "/users/register",
  "/users/refresh",
];

let refreshRequest: Promise<string | null> | null = null;

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

    const { refreshToken, clearSession, setTokens } = useAuthStore.getState();

    if (!refreshToken) {
      clearSession();
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshRequest) {
      refreshRequest = axios
        .post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
          `${env.apiBaseUrl}/users/refresh`,
          { refreshToken },
        )
        .then((response) => {
          const tokens = response.data.data;
          setTokens(tokens.accessToken, tokens.refreshToken);
          return tokens.accessToken;
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

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
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
