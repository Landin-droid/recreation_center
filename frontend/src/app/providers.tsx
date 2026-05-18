import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, type PropsWithChildren } from "react";
import { useAuthStore } from "@features/auth/model/auth-store";
import { authApi } from "@features/auth/api";
import axios from "axios";
import type { User } from "@shared/api/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

let bootstrapSessionRequest: Promise<User> | null = null;

function bootstrapSession() {
  if (!bootstrapSessionRequest) {
    bootstrapSessionRequest = authApi.profile().finally(() => {
      bootstrapSessionRequest = null;
    });
  }

  return bootstrapSessionRequest;
}

export function AppProviders({ children }: PropsWithChildren) {
  const {
    setSession,
    setBootstrapping,
    clearSession,
    user: storedUser,
  } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      // Если у нас уже есть данные пользователя в localStorage, мы можем
      // пропустить стадию блокирующего лоадера, если хотим.
      // Но для надежности оставим проверку.
      setBootstrapping(true);

      try {
        const user = await bootstrapSession();
        if (isMounted) {
          setSession({ user });
        }
      } catch (error) {
        if (!isMounted) return;

        // Если это ошибка авторизации (401) и refresh не помог, тогда чистим сессию
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearSession();
        }
        // Если это сетевая ошибка, мы НЕ чистим сессию, чтобы пользователь
        // не разлогинился при плохом интернете.
      } finally {
        if (isMounted) {
          setBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [setSession, setBootstrapping, clearSession]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HelmetProvider>
  );
}
