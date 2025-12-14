import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DIAGNOSTIC_MODE } from '../app/diagnostics';
import { APP_ROUTES } from '../app/routeRegistry';
import { useAppStore } from '../lib/store';
import { ScreenId } from '../rbac/screenIds';
import { canView, canDo, getMyPermissions } from '../rbac/can';
import { Badge } from './ui/design-system';
import { ChevronDown, ChevronUp, AlertCircle, Database, Shield, Monitor } from 'lucide-react';

interface DiagnosticBannerProps {
  screenId: ScreenId;
}

export const DiagnosticBanner: React.FC<DiagnosticBannerProps> = ({ screenId }) => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const { currentRole, currentCluster } = useAppStore();
  
  if (!DIAGNOSTIC_MODE) return null;

  const routeConfig = APP_ROUTES[screenId];
  const permissions = getMyPermissions(currentCluster?.id || '', screenId);
  const isViewable = canView(currentCluster?.id || '', screenId);
  
  // Basic validation
  const routeMatch = routeConfig?.path === location.pathname || (routeConfig?.path.includes(':') && location.pathname.startsWith(routeConfig.path.split(':')[0]));

  return (
    <div className="mb-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900/50 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-hidden">
      <div 
        className="flex items-center justify-between px-3 py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Monitor className="h-3 w-3 text-blue-500" />
          <span className="font-bold">DIAGNOSTIC MODE</span>
          <span className="opacity-50">|</span>
          <span>{routeConfig?.componentName || 'Unknown Component'}</span>
        </div>
        <div className="flex items-center gap-2">
          {!routeMatch && <Badge variant="destructive" className="h-4 text-[9px] px-1">Route Mismatch</Badge>}
          {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Identity */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1">
              <Monitor className="h-3 w-3" /> Identity
            </h4>
            <div className="space-y-1">
              <div>Page: <span className="font-semibold">{routeConfig?.label}</span></div>
              <div>Route: {location.pathname}</div>
              <div>Def. Path: {routeConfig?.path}</div>
              <div>Screen ID: <span className="bg-slate-200 dark:bg-slate-800 px-1 rounded">{screenId}</span></div>
            </div>
          </div>

          {/* Context */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Context
            </h4>
            <div className="space-y-1">
              <div>Role: {currentRole?.name} ({currentRole?.id})</div>
              <div>Cluster: {currentCluster?.id}</div>
              <div>Access: {isViewable ? <span className="text-emerald-600 font-bold">ALLOWED</span> : <span className="text-rose-600 font-bold">DENIED</span>}</div>
              <div>Verbs: [{permissions?.join(', ')}]</div>
            </div>
          </div>

          {/* Data */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1">
              <Database className="h-3 w-3" /> Data Source
            </h4>
            <div className="space-y-1">
              <div>Provider: MockServiceAdapter</div>
              <div>State: Local Memory / Zustand</div>
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-3 w-3" />
                <span>No backend connection</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
