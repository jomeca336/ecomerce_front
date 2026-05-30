import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      roles: [],
      login: (token, roles) => set({ token, roles }),
      logout: () => set({ token: null, roles: [] }),
    }),
    { name: 'auth-storage' }
  )
)
