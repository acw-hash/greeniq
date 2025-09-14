import { create } from 'zustand'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface UIState {
  toasts: Toast[]
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
}

interface UIActions {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>((set) => ({
  // State
  toasts: [],
  sidebarOpen: false,
  theme: 'system',

  // Actions
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
    
    // Auto remove toast after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }))
    }, toast.duration || 5000)
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  
  setTheme: (theme) => set({ theme }),
}))
