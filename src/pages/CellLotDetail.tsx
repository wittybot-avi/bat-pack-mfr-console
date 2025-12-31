import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cellService, CellLot, CellSerial } from '../services/cellService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button } from '../components/ui/design-system';
import { ArrowLeft, Fingerprint, Printer, ShieldCheck, History, Info, Play, CheckCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function CellLotDetail() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [lot, setLot] = useState<CellLot | null>(null);
  const [serials, setSerials] = useState<CellSerial[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lotId) loadData(lotId);
  }, [lotId]);

  const loadData = async (id: string) => {
    setLoading(true);
    const l = await cellService.getLot(id);
    if (l) {
      setLot(l);
      const s = await cellService.listSerials(id);
      setSerials(s);
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!lot) return;
    try {
        await cellService.publishLot(lot.id);
        addNotification({ title: 'Published', message: 'Lot is now published for production.', type: 'success' });
        loadData(lot.id);
    } catch (e) {
        addNotification({ title: 'Error', message: 'Publish failed.', type: 'error' });
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading lot data...</div>;
  if (!lot) return <div className="p-20 text-center">Lot not found.</div>;

  const canAction = ['C2', 'CS'].includes(currentCluster?.id || '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cells')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{lot.lotCode}</h2>
            <Badge variant={lot.status === 'PUBLISHED' ? 'success' : 'secondary'}>{lot.status}</Badge>
          </div>
          <p className="text-muted-foreground">{lot.supplierName} • Received {lot.receivedDate}</p>
        </div>
        <div className="flex gap-2">
            {lot.status === 'DRAFT' && canAction && (
                <Button onClick={() => navigate(`/cells/${lot.id}/serialize`)}>
                    <Fingerprint className="mr-2 h-4 w-4" /> Start Serialization
                </Button>
            )}
            {lot.status === 'SERIALIZED' && canAction && (
                 <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePublish}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Publish Serials
                </Button>
            )}
            {lot.status === 'PUBLISHED' && (
                 <Button variant="outline" onClick={() => navigate(`/cells/${lot.id}/scan`)}>
                    <Play className="mr-2 h-4 w-4" /> Start Assembly Scanning
                </Button>
            )}
        </div>
      </div>

      <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground">
        {['overview', 'serials', 'audit'].map(t => (
            <button key={t} className={`pb-2 border-b-2 capitalize transition-all ${activeTab === t ? 'border-primary text-primary font-bold' : 'border-transparent'}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardContent className="p-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Supplier Lot No</label>
                                <p className="font-medium">{lot.supplierLotNo}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Quantity Received</label>
                                <p className="font-medium text-lg">{lot.quantityReceived.toLocaleString()} cells</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Chemistry / Form</label>
                                <p className="font-medium">{lot.chemistry} • {lot.formFactor}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Serial Policy</label>
                                <p className="font-medium">Prefix: {lot.serialPolicy.prefix} ({lot.serialPolicy.scheme})</p>
                            </div>
                            <div className="col-span-2 pt-4 border-t">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Notes</label>
                                <p className="text-sm mt-1">{lot.notes || 'No additional notes.'}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'serials' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 border rounded text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Available</p>
                                    <p className="text-xl font-bold">{serials.filter(s => s.status === 'AVAILABLE').length}</p>
                                </div>
                                <div className="p-3 border rounded text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Scanned</p>
                                    <p className="text-xl font-bold text-emerald-500">{serials.filter(s => s.status === 'SCANNED').length}</p>
                                </div>
                                <div className="p-3 border rounded text-center">
                                    <p className="text-xs text-muted-foreground uppercase">Quarantined</p>
                                    <p className="text-xl font-bold text-rose-500">{serials.filter(s => s.status === 'QUARANTINED').length}</p>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Serial</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Bound To</TableHead>
                                        <TableHead>Scanned At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <tbody>
                                    {serials.slice(0, 10).map(s => (
                                        <TableRow key={s.serial}>
                                            <TableCell className="font-mono">{s.serial}</TableCell>
                                            <TableCell><Badge variant={s.status === 'AVAILABLE' ? 'outline' : 'default'}>{s.status}</Badge></TableCell>
                                            <TableCell className="text-xs">{s.boundTo ? `${s.boundTo.kind}: ${s.boundTo.refId}` : '-'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{s.scannedAt ? new Date(s.scannedAt).toLocaleTimeString() : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </tbody>
                            </Table>
                            {serials.length > 10 && <p className="text-xs text-center text-muted-foreground">Showing first 10 of {serials.length} serials.</p>}
                        </div>
                    )}

                    {activeTab === 'audit' && (
                         <div className="space-y-4">
                            <div className="flex gap-4 items-start pb-4 border-b">
                                <History className="h-5 w-5 text-slate-400 mt-1" />
                                <div>
                                    <p className="text-sm font-bold">Lot Registered</p>
                                    <p className="text-xs text-muted-foreground">{new Date(lot.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Compliance Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Digital Identity Active</p>
                            <p className="text-xs text-slate-400">All cells in this lot are traceable to origin CATL facility.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addNotification({title: 'Stub', message: 'Print trigger mock', type: 'info'})}>
                        <Printer className="h-4 w-4" /> Print Label Batch
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}