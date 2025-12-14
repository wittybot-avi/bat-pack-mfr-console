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
  Search
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { UserRole } from '../domain/types';
import { Button, Input, Badge } from './ui/design-system';

const SidebarItem = ({ icon: Icon, label, path, active }: { icon: any, label: string, path: string, active: boolean }) => (
  <Link to={path}>
    <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${active ? 'bg-primary/10 text-primary font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
      <Icon size={18} />
      <span>{label}</span>
    </div>
  </Link>
);

export const Layout = () => {
  const { theme, toggleTheme, userRole, setUserRole, sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  const getNavItems = () => {
    const common = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: Package, label: 'Batches', path: '/batches' },
      { icon: Battery, label: 'Batteries', path: '/batteries' },
      { icon: Activity, label: 'Telemetry', path: '/telemetry' },
    ];

    if (userRole === UserRole.MANUFACTURER_ADMIN) {
      return [
        ...common,
        { icon: Cpu, label: 'Provisioning', path: '/provisioning' },
        { icon: ClipboardCheck, label: 'EOL / QA', path: '/eol' },
        { icon: Truck, label: 'Logistics', path: '/logistics' },
        { icon: ShieldCheck, label: 'Compliance', path: '/compliance' },
      ];
    } else if (userRole === UserRole.QA_ENGINEER) {
      return [
        ...common,
        { icon: Cpu, label: 'Provisioning', path: '/provisioning' },
        { icon: ClipboardCheck, label: 'EOL / QA', path: '/eol' },
      ];
    }
    
    return common; // Logistics default
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed inset-y-0 z-50 flex flex-col transition-all duration-300 border-r bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden`}>
        <div className="h-16 flex items-center px-6 border-b dark:border-slate-800">
          <div className="h-8 w-8 rounded bg-primary mr-3 flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-lg tracking-tight">Aayatana Tech</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {getNavItems().map((item) => (
            <SidebarItem 
              key={item.path} 
              {...item} 
              active={location.pathname === item.path} 
            />
          ))}
        </div>

        <div className="p-4 border-t dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <span className="text-xs font-bold">JS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">John Smith</span>
              <span className="text-xs text-slate-500 truncate w-32">{userRole}</span>
            </div>
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
              <Input type="search" placeholder="Search batches, IDs, or logs... (Ctrl+K)" className="pl-9 bg-slate-100 dark:bg-slate-800 border-none" />
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

            <select 
              className="text-xs bg-transparent border rounded p-1 dark:bg-slate-800"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
            >
              <option value={UserRole.MANUFACTURER_ADMIN}>Admin</option>
              <option value={UserRole.QA_ENGINEER}>QA Eng</option>
              <option value={UserRole.LOGISTICS_OPERATOR}>Logistics</option>
            </select>
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