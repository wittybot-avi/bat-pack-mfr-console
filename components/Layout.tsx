
import React, { useEffect, useState } from 'react';
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  Menu,
  Bell,
  Search,
  Users,
  LogOut,
  Zap,
  AlertTriangle,
  X,
  Database,
  Monitor,
  Loader2,
  BookOpen
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { Button, Input, Badge } from './ui/design-system';
import { APP_VERSION, PATCH_LEVEL, LAST_PATCH_ID } from '../app/patchInfo';
import { ScreenId, SCREEN_GROUPS } from '../rbac/screenIds';
import { canView } from '../rbac/can';
import { APP_ROUTES, checkConsistency } from '../app/routeRegistry';
import { ROUTES } from '../app/routes';
import { DIAGNOSTIC_MODE } from '../app/diagnostics';
import { traceSearchService } from '../services/traceSearchService';
import { scenarioStore, DemoScenario } from '../demo/scenarioStore';
import { routerSafe } from '../utils/routerSafe';

interface SidebarItemProps {
  icon: any;
  label: string;
  path: string;
  active: boolean;
  disabled?: boolean;
  tooltip?: string;
  mismatch?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active, disabled, tooltip, mismatch }) => {
  const content = (
    <div className={`flex items-center justify-between px-3 py-2 rounded-md transition-all ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30' : active ? 'bg-primary/10 text-primary font-medium' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="text-sm">{label}</span>
      </div>
      {(mismatch || disabled) && (
        <div className="flex items-center gap-1">
          {/* Fix: Wrapped AlertTriangle in a span to provide title tooltip, resolving type error where Lucide icons do not accept title prop */}
          {mismatch && DIAGNOSTIC_MODE && <span title="Path mismatch in registry"><AlertTriangle size={12} className="text-rose-500" /></span>}
          {disabled && <Badge variant="outline" className="text-[8px] h-3 px-1 border-slate-300">LOCKED</Badge>}
        </div>
      )}
    </div>
  );

  if (disabled) return <div title={tooltip || "Access Restricted"}>{content}</div>;

  return (
    <Link to={path}>
      {content}
    </Link>
  );
};

export const Layout = () => {
  const { theme, toggleTheme, currentRole, currentCluster, logout, sidebarOpen, toggleSidebar, addNotification } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showNoMatch, setShowNoMatch] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<DemoScenario>(scenarioStore.getScenario());
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    scenarioStore.init();
    routerSafe.trackRoute(location.pathname, location.search);

    if (DIAGNOSTIC_MODE) {
      checkConsistency();
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setShowNoMatch(false);
    try {
        const resolution = await traceSearchService.resolveIdentifier(searchQuery);
        if (resolution) {
            navigate(resolution.route);
            setSearchQuery('');
        } else {
            setShowNoMatch(true);
        }
    } catch (err) {
        console.error("Search failed:", err);
    } finally {
        setSearching(false);
    }
  };

  const handleScenarioChange = (s: DemoScenario) => {
    if (s === currentScenario || isSwitching) return;
    setIsSwitching(true);
    scenarioStore.setScenario(s);
    setCurrentScenario(s);
    addNotification({ title: 'Scenario Change', message: `Wiping state for ${s}...`, type: 'info' });
    navigate(ROUTES.DASHBOARD, { replace: true });
    setTimeout(() => { window.location.reload(); }, 500);
  };

  const renderNavGroup = (groupName: string, screenIds: ScreenId[]) => {
    if (!currentCluster) return null;
    const visibleItems = screenIds.filter(id => canView(currentCluster.id, id));

    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{groupName}</h3>
        <div className="space-y-1">
          {visibleItems.map(id => {
            const config = APP_ROUTES[id];
            if (!config) return null;
            
            // Skip sub-pages or details from the main sidebar
            if (id.includes('DETAIL') || id.includes('EDIT') || id.includes('_RUN') || id.includes('_TAB')) {
               return null;
            }

            // Standardize path for display (strip params)
            const displayPath = config.path.includes(':') ? config.path.split('/:')[0] : config.path;

            return (
              <SidebarItem 
                key={id}
                icon={config.icon} 
                label={config.label} 
                path={displayPath} 
                active={location.pathname === displayPath || (location.pathname.startsWith(displayPath) && displayPath !== '/')}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (!currentRole || !currentCluster) return null;

  const isSuperUser = currentCluster.id === 'CS';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100`}>
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} fixed inset-y-0 z-50 flex flex-col transition-all duration-300 border-r bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden`}>
        <div className="h-16 flex items-center px-6 border-b dark:border-slate-800 shrink-0">
          <div className={`h-8 w-8 rounded mr-3 flex items-center justify-center text-white font-bold ${isSuperUser ? 'bg-amber-500' : 'bg-primary'}`}>
            {isSuperUser ? <Zap size={18} fill="currentColor" /> : 'A'}
          </div>
          <span className="font-bold text-lg tracking-tight">Aayatana Tech</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          {renderNavGroup('SOP Guide', SCREEN_GROUPS.GUIDED)}
          {renderNavGroup('Observe', SCREEN_GROUPS.OBSERVE)}
          {renderNavGroup('Design', SCREEN_GROUPS.DESIGN)}
          {renderNavGroup('Trace', SCREEN_GROUPS.TRACE)}
          {renderNavGroup('Operate', SCREEN_GROUPS.OPERATE)}
          {renderNavGroup('Assure', SCREEN_GROUPS.ASSURE)}
          {renderNavGroup('Resolve', SCREEN_GROUPS.RESOLVE)}
          {renderNavGroup('Govern', SCREEN_GROUPS.GOVERN)}
          {renderNavGroup('Admin', SCREEN_GROUPS.ADMIN)}
        </div>

        <div className="p-4 border-t dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-slate-500 ${isSuperUser ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <Users size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate" title={currentRole.name}>{currentRole.name}</span>
              <span className="text-xs text-slate-500 truncate">{currentCluster.id} Cluster</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono leading-tight">
            v{APP_VERSION} | P{PATCH_LEVEL}<br/>
            {LAST_PATCH_ID}
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <header className="h-16 border-b bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu size={20} />
            </Button>
            
            <form onSubmit={handleGlobalSearch} className="relative hidden md:block w-72 lg:w-96">
              <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${searching ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              <Input 
                type="search" 
                placeholder="Global Search (Asset IDs, Serials)..." 
                className="pl-9 bg-slate-100 dark:bg-slate-800 border-none h-10" 
                value={searchQuery}
                onChange={e => {
                    setSearchQuery(e.target.value);
                    if (showNoMatch) setShowNoMatch(false);
                }}
              />
              {showNoMatch && (
                  <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-900 border rounded-lg shadow-2xl p-4 z-[100] animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-bold flex items-center gap-2 text-rose-500"><AlertTriangle size={14} /> Not Found</h4>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNoMatch(false)}><X size={14}/></Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">Try specific serials or lot IDs.</p>
                  </div>
              )}
            </form>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden lg:block"></div>
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-50 dark:bg-slate-800/50`}>
                <Database size={14} className="text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Demo:</span>
                <select 
                    className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300"
                    value={currentScenario}
                    onChange={(e) => handleScenarioChange(e.target.value as DemoScenario)}
                >
                    <option value="HAPPY_PATH">Happy Path</option>
                    <option value="MISMATCH">Mismatch</option>
                    <option value="TAMPER">Tamper</option>
                    <option value="EMPTY">Blank Slate</option>
                </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Bell size={20} />
            </Button>
            <div className="flex items-center border rounded-md p-1 bg-slate-100 dark:bg-slate-800">
              <button onClick={toggleTheme} className="px-2 py-1 text-xs rounded shadow-sm bg-white dark:bg-slate-700 font-medium transition-all">
                {theme === 'light' ? 'Light' : 'Dark'}
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`hidden xl:flex items-center gap-1 font-normal bg-slate-50 dark:bg-slate-800`}>
                <span className="truncate max-w-[80px] font-bold">{currentRole.name}</span>
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {DIAGNOSTIC_MODE && (
            <div className="mb-4 px-4 py-1.5 bg-slate-900 text-[10px] text-white font-mono flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-400"><Database size={12}/> {currentScenario}</span>
                    <span className="opacity-50">|</span>
                    <span className="flex items-center gap-1"><Monitor size={12}/> {location.pathname}</span>
                </div>
                <span>Patch: {LAST_PATCH_ID}</span>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
