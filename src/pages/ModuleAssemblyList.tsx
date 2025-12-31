
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleService } from '../services/moduleService';
import { ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button } from '../components/ui/design-system';
import { Plus, Eye, Archive, User, Calendar, Loader2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';

export default function ModuleAssemblyList() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = canDo(currentCluster?.id || '', ScreenId.MODULE_ASSEMBLY_LIST, 'C');

  useEffect(() => {
    moduleService.listModules().then(data => {
      setModules(data);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: ModuleStatus) => {
    switch (status) {
      case ModuleStatus.SEALED: return <Badge variant="success">SEALED</Badge>;
      case ModuleStatus.IN_PROGRESS: return <Badge variant="default">IN PROGRESS</Badge>;
      case ModuleStatus.DRAFT: return <Badge variant="outline">DRAFT</Badge>;
      case ModuleStatus.QUARANTINED: return <Badge variant="destructive">QUARANTINED</Badge>;
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
          <Button onClick={() => navigate('/operate/modules/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Start Assembly
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Order ID</TableHead>
                <TableHead>SKU Blueprint</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Bound Cells</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
              ) : modules.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No active module work orders found.</TableCell></TableRow>
              ) : (
                modules.map(m => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(`/operate/modules/${m.id}`)}>
                    <TableCell className="font-mono font-bold text-primary">{m.id}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{m.skuCode}</div>
                    </TableCell>
                    <TableCell className="text-xs">{m.targetCells} Cells</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${(m.boundCellSerials.length / m.targetCells) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono">{m.boundCellSerials.length}/{m.targetCells}</span>
                       </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                    <TableCell>
                       <div className="flex flex-col text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(m.updatedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><User size={10} /> {m.createdBy}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="gap-2">Open <Eye size={14} /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-md border border-dashed text-xs text-muted-foreground font-mono">
        INTEGRATION NOTE: This module interacts with the SKU Blueprint service to enforce cell counts and chemistry rules. 
        Module sealing triggers readiness for Pack Assembly linkage.
      </div>
    </div>
  );
}
