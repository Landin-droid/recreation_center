import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@shared/api/types";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isBootstrapping: boolean;
  setSession: (payload: {
    user: User;
    accessToken?: string;
    refreshToken?: string;
  }) => void;
  updateUser: (user: User) => void;
  clearSession: () => void;
  setBootstrapping: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isBootstrapping: true,
      setSession: ({ user, accessToken, refreshToken }) =>
        set((state) => ({
          user,
          accessToken: accessToken !== undefined ? accessToken : state.accessToken,
          refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
          isBootstrapping: false,
        })),
      updateUser: (user) => set({ user }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isBootstrapping: false,
        }),
      setBootstrapping: (value) => set({ isBootstrapping: value }),
    }),
    {
      name: "pobeda-auth",
      partialize: ({ user, accessToken, refreshToken }) => ({
        user,
        accessToken,
        refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setBootstrapping(false);
      },
    },
  ),
);
