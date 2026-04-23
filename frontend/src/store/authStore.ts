import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { User } from "../types/index";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setTokens: (accessToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        setUser: (user: User) => set({ user, isAuthenticated: true }),
        setTokens: (accessToken: string) => set({ accessToken }),
        logout: () =>
          set({ user: null, accessToken: null, isAuthenticated: false }),
        loadFromStorage: () => {
          const accessToken = localStorage.getItem("accessToken");
          if (accessToken) {
            set({ accessToken });
          }
        },
      }),
      {
        name: "auth-store",
        storage: {
          getItem: (key) => {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
          },
          setItem: (key, value) =>
            localStorage.setItem(key, JSON.stringify(value)),
          removeItem: (key) => localStorage.removeItem(key),
        },
      },
    ),
  ),
);
