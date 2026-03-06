"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ManagerMember } from "@/types";

interface AuthState {
  user: ManagerMember | null;
  isAuthenticated: boolean;
  profileImage: string | null;
  login: (user: ManagerMember) => void;
  logout: () => void;
  setProfileImage: (image: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      profileImage: null,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, profileImage: null }),
      setProfileImage: (image) => set({ profileImage: image }),
    }),
    {
      name: "healthfit-auth",
    }
  )
);
