import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleService } from '../services/moduleService';
import { ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Tooltip } from '../components/ui/design-system';
import { Plus, Eye, User, Calendar, Loader2, History } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { TraceDrawer } from '../components/TraceDrawer';
import { STATUS_LABELS } from '../services/workflowGuardrails';

export default function ModuleAssemblyList() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [traceId, setTraceId] = useState<string | null>(null);

  const canCreate = canDo(currentCluster?.id || '', ScreenId.MODULE_ASSEMBLY_LIST, 'C');

  useEffect(() => {
    moduleService.listModules().then(data => {
      setModules(data);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case ModuleStatus.SEALED: return <Badge variant="success">{STATUS_LABELS.COMPLETED}</Badge>;
      case ModuleStatus.IN_PROGRESS: return <Badge variant="default">{STATUS_LABELS.IN_PROGRESS}</Badge>;
      case ModuleStatus.DRAFT: return <Badge variant="outline">{STATUS_LABELS.DRAFT}</Badge>;
      case ModuleStatus.QUARANTINED: return <Badge variant="destructive">{STATUS_LABELS.FAILED}</Badge>;
      case ModuleStatus.CONSUMED: return <Badge variant="secondary">CONSUMED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Module Assembly</h2>
          <p className="text-muted-foreground">Monitor sub-assembly work orders and cell binding progress.</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/operate/modules/new')} className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> Start Assembly
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Work Order ID</TableHead>
                <TableHead>SKU Blueprint</TableHead>
                <TableHead>Bound Cells</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
              ) : modules.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No active module work orders found.</TableCell></TableRow>
              ) : (
                modules.map(m => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" onClick={() => navigate(`/operate/modules/${m.id}`)}>
                    <TableCell className="font-mono font-bold text-primary">{m.id}</TableCell>
                    <TableCell>{m.skuCode}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${(m.boundCellSerials.length / m.targetCells) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono w-10">{m.boundCellSerials.length}/{m.targetCells}</span>
                       </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(m.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                           <Tooltip content="Quick Trace">
                               <Button variant="ghost" size="icon" onClick={() => setTraceId(m.id)} className="text-indigo-500"><History size={16} /></Button>
                           </Tooltip>
                           <Button variant="ghost" size="sm" onClick={() => navigate(`/operate/modules/${m.id}`)}>Open</Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <TraceDrawer isOpen={!!traceId} onClose={() => setTraceId(null)} assetId={traceId || ''} assetType="MODULE" />
    </div>
  );
}