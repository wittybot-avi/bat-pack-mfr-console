import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packAssemblyService } from '../services/packAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { PackInstance, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Tooltip } from '../components/ui/design-system';
import { Plus, Eye, Loader2, ArrowRight, History } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { TraceDrawer } from '../components/TraceDrawer';
import { STATUS_LABELS } from '../services/workflowGuardrails';

export default function PackAssemblyList() {
  const navigate = useNavigate();
  const { currentCluster, currentRole, addNotification } = useAppStore();
  
  const [packs, setPacks] = useState<PackInstance[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState('');
  const [traceId, setTraceId] = useState<string | null>(null);

  const canCreate = canDo(currentCluster?.id || '', ScreenId.PACK_ASSEMBLY_LIST, 'C');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pData, sData] = await Promise.all([
      packAssemblyService.listPacks(),
      skuService.listSkus()
    ]);
    setPacks(pData);
    setSkus(sData);
    setLoading(false);
  };

  const getStatusBadge = (status: PackStatus) => {
    switch (status) {
      case PackStatus.FINALIZED: return <Badge variant="success">{STATUS_LABELS.COMPLETED}</Badge>;
      case PackStatus.READY_FOR_EOL: return <Badge className="bg-indigo-500 text-white">READY FOR EOL</Badge>;
      case PackStatus.IN_PROGRESS: return <Badge variant="default">{STATUS_LABELS.IN_PROGRESS}</Badge>;
      case PackStatus.DRAFT: return <Badge variant="outline">{STATUS_LABELS.DRAFT}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pack Assembly</h2>
          <p className="text-muted-foreground">Main assembly line: linking modules into final battery packs.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsStartModalOpen(true)} className="gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> Start Pack Build
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Build ID</TableHead>
                <TableHead>SKU Blueprint</TableHead>
                <TableHead>Modules Linked</TableHead>
                <TableHead>QC Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
              ) : packs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No active pack builds found.</TableCell></TableRow>
              ) : (
                packs.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group" onClick={() => navigate(`/operate/packs/${p.id}`)}>
                    <TableCell className="font-mono font-bold text-primary">{p.id}</TableCell>
                    <TableCell>{p.skuCode}</TableCell>
                    <TableCell>{p.moduleIds.length}/{p.requiredModules || 1}</TableCell>
                    <TableCell><Badge variant={p.qcStatus === 'PASSED' ? 'success' : 'outline'}>{p.qcStatus}</Badge></TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                           <Tooltip content="Genealogy">
                               <Button variant="ghost" size="icon" onClick={() => setTraceId(p.id)} className="text-indigo-500"><History size={16} /></Button>
                           </Tooltip>
                           <Button variant="ghost" size="sm" onClick={() => navigate(`/operate/packs/${p.id}`)}>Open</Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <TraceDrawer isOpen={!!traceId} onClose={() => setTraceId(null)} assetId={traceId || ''} assetType="PACK" />
    </div>
  );
}