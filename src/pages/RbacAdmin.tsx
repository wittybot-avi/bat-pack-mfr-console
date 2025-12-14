import React from 'react';
import { useAppStore } from '../lib/store';
import { RBAC_POLICY } from '../rbac/policy';
import { SCREEN_GROUPS, ScreenId } from '../rbac/screenIds';
import { VERB_LABELS, Verbs } from '../rbac/verbs';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui/design-system';
import { Shield, Download, UserCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RbacAdmin() {
  const { currentRole, currentCluster } = useAppStore();
  const navigate = useNavigate();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(RBAC_POLICY, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "rbac_policy.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Safe guard
  if (!currentRole || !currentCluster) return null;

  const isSuperUser = currentCluster.id === 'CS';
  const allScreenIds = Object.values(SCREEN_GROUPS).flat();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Access Control Audit</h2>
          <p className="text-muted-foreground">Inspect RBAC policies and current session privileges.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/login')}>
            <UserCircle className="mr-2 h-4 w-4" /> Switch Role
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export Policy JSON
          </Button>
        </div>
      </div>

      <Card className={`bg-slate-50 dark:bg-slate-900 ${isSuperUser ? 'border-amber-400 dark:border-amber-600' : 'border-primary/20'}`}>
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isSuperUser ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
              {isSuperUser ? <Zap className="h-6 w-6" fill="currentColor" /> : <Shield className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <p className="text-sm font-medium text-muted-foreground">Current Session</p>
                 {isSuperUser && <Badge variant="warning" className="text-[10px]">Super User Mode</Badge>}
              </div>
              <h3 className="text-xl font-bold">{currentRole.name}</h3>
              <p className="text-sm text-slate-500">{currentCluster.id} - {currentCluster.name}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-2xl font-bold text-primary">
               {isSuperUser ? allScreenIds.length : Object.keys(RBAC_POLICY[currentCluster.id] || {}).length}
             </div>
             <div className="text-xs text-muted-foreground">Accessible Modules</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix (Active Cluster: {currentCluster.id})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(SCREEN_GROUPS).map(([group, screens]) => (
              <div key={group}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider border-b pb-1">{group}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {screens.map((screen) => {
                    const verbs = isSuperUser ? Object.values(Verbs) : RBAC_POLICY[currentCluster.id]?.[screen as ScreenId];
                    const isAllowed = !!verbs;
                    
                    return (
                      <div key={screen} className={`p-3 rounded border ${isAllowed ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-mono text-xs font-semibold">{screen}</span>
                           {isAllowed ? <Badge variant="success" className="text-[10px]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Restricted</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {isAllowed ? (
                             isSuperUser ? 
                             <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800">ALL ACTIONS ENABLED</span> 
                             :
                             verbs?.map(v => (
                                <span key={v} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20" title={VERB_LABELS[v]}>
                                  {v}
                                </span>
                             ))
                          ) : (
                             <span className="text-[10px] text-muted-foreground italic">No access</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}