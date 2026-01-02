import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveRoute, RouteLedgerEntry } from '../app/routeLedger';
import { useAppStore } from '../lib/store';
import { Badge } from './ui/design-system';
import { Monitor, Shield, Database, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { isDiagEnabled } from '../app/diagnostics';

export const DiagnosticPanel: React.FC = () => {
  const location = useLocation();
  const { currentRole, currentCluster } = useAppStore();
  
  const [enabled, setEnabled] = useState(isDiagEnabled());
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('DIAG_COLLAPSED') !== 'false');

  useEffect(() => {
    localStorage.setItem('DIAG_COLLAPSED', collapsed.toString());
  }, [collapsed]);

  // Sync state on navigation
  useEffect(() => {
    setEnabled(isDiagEnabled());
  }, [location]);

  if (!enabled) return null;

  const route = resolveRoute(location.pathname);

  return (
    <div className="mb-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-1">
      <div 
        className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-bold tracking-tighter uppercase">Diagnostic Mode</span>
          <span className="opacity-30">|</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold">
            {route ? route.title : 'Unregistered Page'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!route && <Badge variant="destructive" className="h-4 text-[9px] px-1 font-bold animate-pulse">ROUTE_MISSING</Badge>}
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-8 leading-relaxed border-t border-slate-200 dark:border-slate-800">
          {/* Identity */}
          <div className="space-y-1.5 border-r dark:border-slate-800 pr-4">
            <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-2 flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
              <Monitor size={12} className="text-blue-500" /> Identity
            </h4>
            <div className="flex justify-between gap-4"><span>Path:</span> <span className="text-blue-500 font-bold truncate max-w-[150px]">{location.pathname}</span></div>
            <div className="flex justify-between"><span>Pattern:</span> <span>{route?.path || '—'}</span></div>
            <div className="flex justify-between"><span>Screen ID:</span> <Badge variant="outline" className="text-[9px] h-4 leading-none font-mono">{route?.screenId || 'UNKNOWN'}</Badge></div>
          </div>

          {/* Context */}
          <div className="space-y-1.5 border-r dark:border-slate-800 pr-4">
            <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-2 flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
              <Shield size={12} className="text-amber-500" /> Context
            </h4>
            <div className="flex justify-between"><span>Role:</span> <span className="truncate max-w-[150px]">{currentRole?.name || 'Guest'}</span></div>
            <div className="flex justify-between"><span>Cluster:</span> <span>{currentCluster?.id || '—'}</span></div>
            <div className="flex justify-between"><span>Module:</span> <span>{route?.module || 'SYSTEM'}</span></div>
          </div>

          {/* Data Source */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-slate-200 mb-2 flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
              <Database size={12} className="text-indigo-500" /> Data Source
            </h4>
            <div className="flex justify-between"><span>Provider:</span> <span>MockLedgerAdapter</span></div>
            <div className="flex justify-between"><span>Sync State:</span> <span className="text-emerald-500 font-bold">STABLE</span></div>
            <div className="mt-2 flex items-center gap-1.5 text-slate-500 font-bold italic opacity-60">
              <AlertCircle size={10} />
              <span>Session: {Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};