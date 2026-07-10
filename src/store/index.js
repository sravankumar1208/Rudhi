import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      profile: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile, role: profile?.role }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ user: null, profile: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'rudhi-auth-storage',
      partialize: (state) => ({ user: state.user, profile: state.profile, role: state.role, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export const useRequestStore = create((set) => ({
  activeRequests: [],
  trackingState: null,
  setActiveRequests: (requests) => set({ activeRequests: requests }),
  setTrackingState: (state) => set({ trackingState: state }),
  reset: () => set({ activeRequests: [], trackingState: null }),
}))

export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  notifications: [],
  setNotifications: (notifications) => set({ 
    notifications, 
    unreadCount: notifications.filter(n => !n.read).length 
  }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  markAllRead: () => set((state) => ({
    unreadCount: 0,
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  reset: () => set({ unreadCount: 0, notifications: [] })
}))

export const useUIStore = create(
  persist(
    (set) => ({
      darkMode: false,
      isOffline: false,
      toggleDarkMode: () => set((state) => {
        const newMode = !state.darkMode
        if (newMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        return { darkMode: newMode }
      }),
      setDarkMode: (darkMode) => set(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        return { darkMode }
      }),
      setOffline: (isOffline) => set({ isOffline }),
    }),
    {
      name: 'rudhi-ui-storage',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
)
