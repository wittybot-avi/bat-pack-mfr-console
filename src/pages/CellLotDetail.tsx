import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cellLotService, CellLot } from '../services/cellLotService';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Printer, FileDown, ShieldCheck, Database, ListChecks, History } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function CellLotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [lot, setLot] = useState<CellLot | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id && id !== 'new') {
      cellLotService.getLot(id).then(setLot);
    }
  }, [id]);

  const handleExportCsv = () => {
    if (!lot) return;
    const headers = 'serial,lotId,model\n';
    const rows = lot.serials.map(s => `${s},${lot.id},${lot.cellModel}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `serials_${lot.id}.csv`;
    link.click();
    addNotification({ title: 'Export Started', message: `Downloaded ${lot.serials.length} serials.`, type: 'success' });
  };

  if (!lot && id !== 'new') return <div className="p-10 text-center">Loading Lot...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/trace/cells')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">{lot?.id || 'New Shipment'}</h2>
          <p className="text-muted-foreground">{lot?.supplier} • {lot?.cellModel}</p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" onClick={handleExportCsv} disabled={!lot?.serials.length}>
            <FileDown className="mr-2 h-4 w-4" /> Export Labels CSV
          </Button>
        </div>
      </div>

      <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground">
        <button className={`pb-2 border-b-2 ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent'}`} onClick={() => setActiveTab('info')}>Lot Info</button>
        <button className={`pb-2 border-b-2 ${activeTab === 'serials' ? 'border-primary text-primary' : 'border-transparent'}`} onClick={() => setActiveTab('serials')}>Serials ({lot?.serials.length})</button>
        <button className={`pb-2 border-b-2 ${activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent'}`} onClick={() => setActiveTab('audit')}>Scan Audit</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Supplier</p>
                    <p className="font-medium">{lot?.supplier}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Shipment ID</p>
                    <p className="font-medium">{lot?.shipmentId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Policy</p>
                    <p className="font-medium">{lot?.serialPolicy}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Quantity</p>
                    <p className="font-medium">{lot?.receivedQty}</p>
                  </div>
                </div>
              )}
              {activeTab === 'serials' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {lot?.serials.map(s => (
                      <div key={s} className="p-2 border rounded font-mono text-xs bg-slate-50 dark:bg-slate-900">{s}</div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'audit' && (
                 <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <History className="h-10 w-10 mb-2 opacity-20" />
                    <p>No scans recorded for this lot yet.</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Scan To Bind</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Target Module ID</label>
                <Input placeholder="e.g. MOD-01" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Scan Cell Serial</label>
                <Input placeholder="Ready to scan..." autoFocus />
              </div>
              <Button className="w-full">Bind Component</Button>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded border-dashed border-2">
                <p className="text-xs text-center text-muted-foreground">Use a barcode scanner to bind cells to a specific Module or Battery Pack.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}