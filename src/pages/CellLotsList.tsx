
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { CellLot } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input, Tooltip } from '../components/ui/design-system';
import { Plus, Search, Fingerprint, ExternalLink, Filter, Loader2, ArrowRight, History } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { TraceDrawer } from '../components/TraceDrawer';

export default function CellLotsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCluster } = useAppStore();
  
  const [lots, setLots] = useState<CellLot[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [traceId, setTraceId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await cellTraceabilityService.listLots();
    setLots(data);
    setLoading(false);
  };

  const filtered = lots.filter(l => 
    l.lotCode.toLowerCase().includes(search.toLowerCase()) || 
    l.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    l.id.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = ['C2', 'C6', 'CS'].includes(currentCluster?.id || '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cell Traceability</h2>
          <p className="text-muted-foreground">Manage incoming cell shipments, unique identities, and scan cycles.</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/trace/cells/new')}>
            <Plus className="mr-2 h-4 w-4" /> Register Shipment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total Lots</p>
                  <p className="text-3xl font-bold text-primary">{lots.length}</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Population</p>
                  <p className="text-3xl font-bold">{lots.reduce((acc, l) => acc + l.quantityReceived, 0).toLocaleString()}</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">WIP serialization</p>
                  <p className="text-3xl font-bold text-amber-500">{lots.filter(l => l.status === 'DRAFT').length}</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Gated & Ready</p>
                  <p className="text-3xl font-bold text-emerald-500">{lots.filter(l => l.status === 'PUBLISHED' || l.status === 'READY_TO_BIND').length}</p>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-sm:w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search lot code, supplier, or ID..." 
                className="pl-9" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot Code</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Serialized</TableHead>
                  <TableHead>Scanned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No matching cell lots found in decentralized ledger.</TableCell></TableRow>
                ) : (
                  filtered.map(lot => (
                    <TableRow key={lot.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => navigate(`/trace/cells/${lot.id}`)}>
                      <TableCell className="font-mono font-bold text-primary">{lot.lotCode}</TableCell>
                      <TableCell>{lot.supplierName}</TableCell>
                      <TableCell>{lot.quantityReceived}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{lot.generatedCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-mono w-8">{Math.round((lot.scannedCount / (lot.generatedCount || 1)) * 100)}%</span>
                           <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${(lot.scannedCount / (lot.generatedCount || 1)) * 100}%` }} />
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lot.status === 'READY_TO_BIND' ? 'success' : lot.status === 'DRAFT' ? 'secondary' : 'default'}>{lot.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Tooltip content="Trace Genealogy">
                                <Button variant="ghost" size="icon" onClick={() => setTraceId(lot.id)} className="text-indigo-500"><History size={16} /></Button>
                            </Tooltip>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/trace/cells/${lot.id}`)} className="gap-2">Manage <ArrowRight size={14} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <TraceDrawer isOpen={!!traceId} onClose={() => setTraceId(null)} assetId={traceId || ''} assetType="CELL" />
    </div>
  );
}
