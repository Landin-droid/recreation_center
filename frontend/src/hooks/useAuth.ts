import { useCallback } from "react";
import { useAuthStore } from "@store/authStore";
import api from "@services/api";
import { LoginInput, UserCreateInput } from "../types/index";

export const useAuth = () => {
  const { user, isAuthenticated, setUser, setTokens, logout } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginInput) => {
      try {
        const response = await api.login(credentials);
        setUser(response.user);
        setTokens(response.accessToken);
        return response;
      } catch (error) {
        throw error;
      }
    },
    [setUser, setTokens],
  );

  const register = useCallback(
    async (data: UserCreateInput) => {
      try {
        const response = await api.register(data);
        setUser(response.user);
        setTokens(response.accessToken);
        return response;
      } catch (error) {
        throw error;
      }
    },
    [setUser, setTokens],
  );

  const handleLogout = useCallback(async () => {
    await api.logout();
    logout();
  }, [logout]);

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout: handleLogout,
  };
};
