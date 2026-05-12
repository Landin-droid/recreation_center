import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@shared/api/types";

interface AuthStore {
  user: User | null;
  isBootstrapping: boolean;
  setSession: (payload: { user: User }) => void;
  updateUser: (user: User) => void;
  clearSession: () => void;
  setBootstrapping: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isBootstrapping: true,
      setSession: ({ user }) =>
        set({
          user,
          isBootstrapping: false,
        }),
      updateUser: (user) => set({ user }),
      clearSession: () =>
        set({
          user: null,
          isBootstrapping: false,
        }),
      setBootstrapping: (value) => set({ isBootstrapping: value }),
    }),
    {
      name: "pobeda-auth",
      partialize: ({ user }) => ({
        user,
      }),
    },
  ),
);
