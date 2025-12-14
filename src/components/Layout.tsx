import React from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Battery, 
  Cpu, 
  Activity, 
  ClipboardCheck, 
  Truck, 
  Settings, 
  Menu,
  ShieldCheck,
  Bell,
  Search,
  Users,
  Box,
  FileText,
  Lock,
  Container,
  AlertOctagon
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Button, Input } from './ui/design-system';
import { APP_VERSION, PATCH_LEVEL, LAST_PATCH_ID } from '../app/patchInfo';
import { CLUSTERS } from '../rbac/clusters';
import { ROLES } from '../rbac/roleCatalog';
import { ScreenId, SCREEN_GROUPS } from '../rbac/screenIds';
import { canView } from '../rbac/can';

// Map ScreenId to Icons and Labels
const NAV_CONFIG: Record<string, { icon: any, label: string, path: string }> = {
  [ScreenId.DASHBOARD]: { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  [ScreenId.TELEMETRY]: { icon: Activity, label: 'Telemetry', path: '/telemetry' },
  [ScreenId.ANALYTICS]: { icon: FileText, label: 'Analytics', path: '/analytics' },
  [ScreenId.BATCHES_LIST]: { icon: Package, label: 'Batches', path: '/batches' },
  [ScreenId.BATTERIES_LIST]: { icon: Battery, label: 'Batteries', path: '/batteries' },
  [ScreenId.PROVISIONING]: { icon: Cpu, label: 'Provisioning', path: '/provisioning' },
  [ScreenId.INVENTORY]: { icon: Box, label: 'Inventory', path: '/inventory' },
  [ScreenId.DISPATCH]: { icon: Truck, label: 'Dispatch', path: '/dispatch' },
  [ScreenId.EOL_QA]: { icon: ClipboardCheck, label: 'EOL / QA', path: '/eol' },
  [ScreenId.WARRANTY]: { icon: AlertOctagon, label: 'Warranty', path: '/warranty' },
  [ScreenId.COMPLIANCE]: { icon: ShieldCheck, label: 'Compliance', path: '/compliance' },
  [ScreenId.CUSTODY]: { icon: Container, label: 'Custody', path: '/custody' },
  [ScreenId.SETTINGS]: { icon: Settings, label: 'Settings', path: '/settings' },
  [ScreenId.RBAC_VIEW]: { icon: Lock, label: 'Access Control', path: '/admin/rbac' },
};

const SidebarItem = ({ icon: Icon, label, path, active }: { icon: any, label: string, path: string, active: boolean }) => (
  <Link to={path}>
    <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${active ? 'bg-primary/10 text-primary font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
      <Icon size={18} />
      <span>{label}</span>
    </div>
  </Link>
);

export const Layout = () => {
  const { theme, toggleTheme, currentRole, currentCluster, switchRole, sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  const renderNavGroup = (groupName: string, screenIds: ScreenId[]) => {
    const visibleItems = screenIds.filter(id => canView(currentCluster.id, id));
    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{groupName}</h3>
        <div className="space-y-1">
          {visibleItems.map(id => {
            const config = NAV_CONFIG[id];
            // If create permissions exist but list view is separate, usually we just link to list.
            if (!config) return null;
            return (
              <SidebarItem 
                key={id}
                icon={config.icon} 
                label={config.label} 
                path={config.path} 
                active={location.pathname === config.path}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed inset-y-0 z-50 flex flex-col transition-all duration-300 border-r bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden`}>
        <div className="h-16 flex items-center px-6 border-b dark:border-slate-800 shrink-0">
          <div className="h-8 w-8 rounded bg-primary mr-3 flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-lg tracking-tight">Aayatana Tech</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          {renderNavGroup('Observe', SCREEN_GROUPS.OBSERVE)}
          {renderNavGroup('Operate', SCREEN_GROUPS.OPERATE)}
          {renderNavGroup('Assure', SCREEN_GROUPS.ASSURE)}
          {renderNavGroup('Resolve', SCREEN_GROUPS.RESOLVE)}
          {renderNavGroup('Govern', SCREEN_GROUPS.GOVERN)}
          {renderNavGroup('Admin', SCREEN_GROUPS.ADMIN)}
        </div>

        <div className="p-4 border-t dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
              <Users size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate" title={currentRole.name}>{currentRole.name}</span>
              <span className="text-xs text-slate-500 truncate" title={currentCluster.name}>{currentCluster.id} Cluster</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono break-all leading-tight">
            v{APP_VERSION} | P{PATCH_LEVEL}<br/>
            {LAST_PATCH_ID}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        {/* Header */}
        <header className="h-16 border-b bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu size={20} />
            </Button>
            <div className="relative hidden md:block w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="pl-9 bg-slate-100 dark:bg-slate-800 border-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell size={20} />
            </Button>
            
            <div className="flex items-center border rounded-md p-1 bg-slate-100 dark:bg-slate-800">
              <button 
                onClick={toggleTheme}
                className="px-2 py-1 text-xs rounded shadow-sm bg-white dark:bg-slate-700 font-medium"
              >
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            </div>

            <div className="relative">
              <select 
                className="appearance-none bg-slate-100 dark:bg-slate-800 border-none text-xs font-medium py-1.5 pl-3 pr-8 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-48 truncate"
                value={currentRole.id}
                onChange={(e) => switchRole(e.target.value)}
              >
                {Object.values(CLUSTERS).map(cluster => (
                  <optgroup key={cluster.id} label={`${cluster.id}: ${cluster.name}`}>
                    {ROLES.filter(r => r.clusterId === cluster.id).map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};