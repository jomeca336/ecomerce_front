import { useAuthStore } from '../store/auth.store'

export function usePermissions() {
  const roles = useAuthStore((state) => state.roles)
  return {
    isAdmin: Array.isArray(roles) && roles.includes('ROLE_ADMIN'),
    isUser:  Array.isArray(roles) && roles.includes('ROLE_USER'),
  }
}
