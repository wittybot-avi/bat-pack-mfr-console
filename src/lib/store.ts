import { create } from 'zustand';
import { UserRole } from '../domain/types';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  notifications: Array<{ id: string; title: string; message: string; type: 'success' | 'error' | 'info' }>;
  addNotification: (n: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),

  userRole: UserRole.MANUFACTURER_ADMIN,
  setUserRole: (role) => set({ userRole: role }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  notifications: [],
  addNotification: (n) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    const newNotif = { ...n, id };
    setTimeout(() => {
      state.removeNotification(id); // Auto dismiss
    }, 4000);
    return { notifications: [...state.notifications, newNotif] };
  }),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  }))
}));