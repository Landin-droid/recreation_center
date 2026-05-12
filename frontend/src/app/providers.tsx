import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { useAuthStore } from "@features/auth/model/auth-store";
import { authApi } from "@features/auth/api";
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
  const { setSession, setBootstrapping, clearSession } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setBootstrapping(true);

      try {
        const user = await bootstrapSession();
        // Если запрос прошел, значит у нас есть валидная сессия в куках
        // Мы можем обновить данные пользователя в сторе
        if (isMounted) {
          setSession({
            user,
          });
        }
      } catch (error) {
        if (isMounted) {
          clearSession();
        }
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
