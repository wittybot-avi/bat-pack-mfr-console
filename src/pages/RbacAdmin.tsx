import React from 'react';
import { useAppStore } from '../lib/store';
import { RBAC_POLICY } from '../rbac/policy';
import { SCREEN_GROUPS, ScreenId } from '../rbac/screenIds';
import { CLUSTERS } from '../rbac/clusters';
import { VERB_LABELS } from '../rbac/verbs';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui/design-system';
import { Shield, Download } from 'lucide-react';

export default function RbacAdmin() {
  const { currentRole, currentCluster } = useAppStore();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(RBAC_POLICY, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "rbac_policy.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Access Control Audit</h2>
          <p className="text-muted-foreground">Inspect RBAC policies and current session privileges.</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export Policy JSON
        </Button>
      </div>

      <Card className="bg-slate-50 dark:bg-slate-900 border-primary/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Session</p>
              <h3 className="text-xl font-bold">{currentRole.name}</h3>
              <p className="text-sm text-slate-500">{currentCluster.id} - {currentCluster.name}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-2xl font-bold text-primary">{Object.keys(RBAC_POLICY[currentCluster.id] || {}).length}</div>
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
                    const verbs = RBAC_POLICY[currentCluster.id]?.[screen as ScreenId];
                    const isAllowed = !!verbs;
                    
                    return (
                      <div key={screen} className={`p-3 rounded border ${isAllowed ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-mono text-xs font-semibold">{screen}</span>
                           {isAllowed ? <Badge variant="success" className="text-[10px]">Active</Badge> : <Badge variant="secondary" className="text-[10px]">Restricted</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {verbs?.map(v => (
                            <span key={v} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20" title={VERB_LABELS[v]}>
                              {v}
                            </span>
                          )) || <span className="text-[10px] text-muted-foreground italic">No access</span>}
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