import { create } from 'zustand';
import { UserRole } from '../domain/types';
import { ROLES, Role } from '../rbac/roleCatalog';
import { CLUSTERS, Cluster } from '../rbac/clusters';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // RBAC State
  currentCluster: Cluster;
  currentRole: Role;
  switchRole: (roleId: string) => void;
  
  // Legacy support
  userRole: UserRole; 
  setUserRole: (role: UserRole) => void;
  
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  notifications: Array<{ id: string; title: string; message: string; type: 'success' | 'error' | 'info' }>;
  addNotification: (n: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
  removeNotification: (id: string) => void;
}

// Default to C1 Plant Head
const DEFAULT_ROLE = ROLES.find(r => r.id === 'C1_PLANT_HEAD')!;
const DEFAULT_CLUSTER = CLUSTERS[DEFAULT_ROLE.clusterId];

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

  // RBAC Init
  currentCluster: DEFAULT_CLUSTER,
  currentRole: DEFAULT_ROLE,
  switchRole: (roleId: string) => {
    const role = ROLES.find(r => r.id === roleId);
    if (!role) return;
    const cluster = CLUSTERS[role.clusterId];
    
    // Map to legacy role for backward compat if needed
    let legacyRole = UserRole.MANUFACTURER_ADMIN;
    if (cluster.id === 'C3') legacyRole = UserRole.QA_ENGINEER;
    if (cluster.id === 'C6') legacyRole = UserRole.LOGISTICS_OPERATOR;

    set({ currentCluster: cluster, currentRole: role, userRole: legacyRole });
  },

  // Legacy Legacy support (Two-way binding sync)
  userRole: UserRole.MANUFACTURER_ADMIN,
  setUserRole: (legacyRole) => {
    // Reverse map legacy role to a default RBAC role
    let newRoleId = 'C1_PLANT_HEAD';
    if (legacyRole === UserRole.QA_ENGINEER) newRoleId = 'C3_QA_MGR';
    if (legacyRole === UserRole.LOGISTICS_OPERATOR) newRoleId = 'C6_LOGISTICS';
    
    const role = ROLES.find(r => r.id === newRoleId)!;
    const cluster = CLUSTERS[role.clusterId];
    
    set({ userRole: legacyRole, currentRole: role, currentCluster: cluster });
  },

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