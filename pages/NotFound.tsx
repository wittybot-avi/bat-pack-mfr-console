// NO ALIAS IMPORTS ALLOWED
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, CardContent } from '../components/ui/design-system';
import { Home, Compass, Info, Terminal, Search, AlertCircle, Construction } from 'lucide-react';
import { ROUTE_LEDGER, resolveRoute } from '../app/routeLedger';
import { BUILD_STAMP } from '../app/patchInfo';
import { SCREEN_GROUPS } from '../rbac/screenIds';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  const matched = resolveRoute(location.pathname);
  const ledgerCount = ROUTE_LEDGER.length;
  
  // Logic: Is this an known navigation group path that simply isn't "Registered" in the ledger?
  const isCorePath = ['/operate', '/assure', '/govern', '/resolve', '/manufacturing', '/trace'].some(p => location.pathname.startsWith(p));

  if (isCorePath && !matched) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-500 mb-6">
          <Construction size={48} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Module Under Stabilization</h1>
        <p className="text-slate-500 max-w-md mb-8">
          The view at <code className="text-amber-600 font-mono">{location.pathname}</code> is undergoing router hardening. 
          The navigational spine is preserved, but direct access is currently gated.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          <Button onClick={() => navigate('/')}>Dashboard</Button>
        </div>
        
        <div className="mt-12 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-mono text-slate-400">
           DIAG_HINT: Route is within known namespace but missing from canonical routeLedger.ts
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center p-6 pt-20 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative h-24 w-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-4 border-rose-500 shadow-xl">
          <Compass size={48} className="text-rose-500" />
        </div>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2 uppercase">
        Route Terminated
      </h1>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
        The location <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-rose-500 font-bold">{location.pathname}</code> is not registered in the system ledger.
      </p>

      {/* Decision Trace Block */}
      <Card className="w-full max-w-lg mb-10 border-rose-500/20 bg-rose-500/5 text-left overflow-hidden">
        <div className="bg-rose-500/10 px-4 py-2 border-b border-rose-500/20 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase tracking-widest">
            <Terminal size={12} /> Registry Decision Trace
          </span>
          <span className="text-[9px] text-rose-500/60 font-mono">{BUILD_STAMP}</span>
        </div>
        <CardContent className="p-4 space-y-2 font-mono text-[10px]">
          <div className="flex justify-between border-b border-rose-500/10 pb-1">
            <span className="text-slate-400">Path Under Audit:</span>
            <span className="text-rose-600 font-bold">{location.pathname}</span>
          </div>
          <div className="flex justify-between border-b border-rose-500/10 pb-1">
            <span className="text-slate-400">Match Function:</span>
            <span className="text-slate-600">resolveRoute()</span>
          </div>
          <div className="flex justify-between border-b border-rose-500/10 pb-1">
            <span className="text-slate-400">Ledger Hit:</span>
            <span className={matched ? "text-emerald-600" : "text-rose-600"}>{matched ? "SUCCESS" : "NO_REGISTERED_PATTERN"}</span>
          </div>
          <div className="flex justify-between border-b border-rose-500/10 pb-1">
            <span className="text-slate-400">Ledger Density:</span>
            <span className="text-slate-600">{ledgerCount} entries</span>
          </div>
          <div className="mt-2 flex items-start gap-2 text-rose-600 bg-rose-100 dark:bg-rose-900/30 p-2 rounded">
            <AlertCircle size={14} className="shrink-0" />
            <p className="leading-tight">
              REASON: The requested URL pattern does not exist in the Canonical Route Ledger. 
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 w-full max-w-xs mb-12">
        <Button className="w-full gap-2 h-12 shadow-lg font-bold" onClick={() => navigate('/')}>
          <Home size={18} /> Return to Home
        </Button>
      </div>
    </div>
  );
}