import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { useAuthStore } from "@features/auth/model/auth-store";
import { authApi } from "@features/auth/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  const { setSession, setBootstrapping, clearSession } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await authApi.profile();
        // Если запрос прошел, значит у нас есть валидная сессия в куках
        // Мы можем обновить данные пользователя в сторе
        setSession({ user, accessToken: "cookie-based", refreshToken: "cookie-based" });
      } catch (error) {
        clearSession();
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, [setSession, setBootstrapping, clearSession]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
