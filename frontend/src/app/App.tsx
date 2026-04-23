import { useEffect } from "react";
import { authApi } from "@features/auth/api";
import { useAuthStore } from "@features/auth/model/auth-store";
import { AppProviders } from "./providers";
import { AppRouter } from "./router";

function BootstrapSession() {
  const {
    accessToken,
    user,
    clearSession,
    updateUser,
    setBootstrapping,
  } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!accessToken) {
        setBootstrapping(false);
        return;
      }

      try {
        const profile = await authApi.profile();

        if (isMounted) {
          updateUser(profile);
        }
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setBootstrapping(false);
        }
      }
    }

    if (!user || accessToken) {
      void bootstrap();
    } else {
      setBootstrapping(false);
    }

    return () => {
      isMounted = false;
    };
  }, [accessToken, user, clearSession, setBootstrapping, updateUser]);

  return <AppRouter />;
}

export function App() {
  return (
    <AppProviders>
      <BootstrapSession />
    </AppProviders>
  );
}
