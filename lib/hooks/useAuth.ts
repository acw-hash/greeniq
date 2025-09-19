import { useAuthStore } from '@/lib/stores/authStore'

export const useAuth = () => {
  return useAuthStore()
}
