
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packService } from '../services/packService';
import { PackInstance, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button } from '../components/ui/design-system';
import { Plus, Eye, Layers, Battery, ClipboardCheck, Loader2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';

export default function PackAssemblyList() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [packs, setPacks] = useState<PackInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = canDo(currentCluster?.id || '', ScreenId.PACK_ASSEMBLY_LIST, 'C');

  useEffect(() => {
    packService.listPacks().then(data => {
      setPacks(data);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: PackStatus) => {
    switch (status) {
      case PackStatus.FINALIZED: return <Badge variant="success">FINALIZED</Badge>;
      case PackStatus.IN_PROGRESS: return <Badge variant="default">IN PROGRESS</Badge>;
      // Fix: Corrected incorrect enum reference from ModuleStatus to PackStatus
      case PackStatus.DRAFT: return <Badge variant="outline">DRAFT</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pack Assembly</h2>
          <p className="text-muted-foreground">Manage final pack builds, module linkage, and BMS integration.</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/operate/packs/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Start Pack Build
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pack ID</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Modules Linked</TableHead>
                <TableHead>QC Status</TableHead>
                <TableHead>Pack Serial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
              ) : packs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No active pack work orders.</TableCell></TableRow>
              ) : (
                packs.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(`/operate/packs/${p.id}`)}>
                    <TableCell className="font-mono font-bold text-primary">{p.id}</TableCell>
                    <TableCell>{p.skuCode}</TableCell>
                    <TableCell>{p.moduleIds.length}</TableCell>
                    <TableCell>
                       <Badge variant={p.qcStatus === 'PASSED' ? 'success' : 'outline'}>{p.qcStatus}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.packSerial || '-'}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card className="border-dashed">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Battery size={16}/> Finalized Today</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">12 Packs</CardContent>
         </Card>
         <Card className="border-dashed">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck size={16}/> QC Passed</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">100% Rate</CardContent>
         </Card>
      </div>
    </div>
  );
}
