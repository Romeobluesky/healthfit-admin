"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ManagerMember } from "@/types";

interface AuthState {
  user: ManagerMember | null;
  isAuthenticated: boolean;
  login: (user: ManagerMember) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "healthfit-auth",
    }
  )
);
