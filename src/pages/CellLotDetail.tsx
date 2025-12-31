
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { CellLot, CellSerialRecord } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, Fingerprint, Printer, ShieldCheck, History, Info, Play, CheckCircle, Download, Database, Scan, Zap, AlertCircle, FileText, LayoutGrid } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';

export default function CellLotDetail() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [lot, setLot] = useState<CellLot | null>(null);
  const [serials, setSerials] = useState<CellSerialRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [genParams, setGenParams] = useState({
    prefix: '',
    start: 1,
    count: 0
  });
  const [scanInput, setScanInput] = useState('');

  // RBAC Helpers
  const clusterId = currentCluster?.id || '';
  const isSuperAdmin = clusterId === 'CS';
  const canGenerate = isSuperAdmin;
  const canExport = isSuperAdmin || ['C1', 'C3', 'C6'].includes(clusterId);
  const canScan = isSuperAdmin || clusterId === 'C2';

  useEffect(() => {
    if (lotId) loadData(lotId);
  }, [lotId]);

  const loadData = async (id: string) => {
    setLoading(true);
    try {
      const l = await cellTraceabilityService.getLot(id);
      if (l) {
        setLot(l);
        const s = await cellTraceabilityService.listSerials(id);
        setSerials(s);
        setGenParams(prev => ({ ...prev, prefix: l.supplierName.slice(0, 3).toUpperCase(), count: l.quantityReceived }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!lot) return;
    if (serials.length > 0 && !window.confirm("Serials already exist. Regenerate (this will wipe existing records for this lot)?")) return;
    
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await cellTraceabilityService.generateSerials(lot.id, { ...genParams, format: 'DEFAULT' }, actor);
      addNotification({ title: 'Generated', message: `${genParams.count} serials generated for this lot.`, type: 'success' });
      await loadData(lot.id);
      setActiveTab('labels');
    } catch (e: any) {
      addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    if (!lot || serials.length === 0) return;
    setProcessing(true);
    try {
      const csvContent = "data:text/csv;charset=utf-8," + "Serial,Status,GeneratedAt\n" + 
        serials.map(s => `${s.serial},${s.status},${s.generatedAt}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `lot_serials_${lot.lotCode}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const actor = `${currentRole?.name} (${clusterId})`;
      await cellTraceabilityService.markExported(lot.id, actor);
      addNotification({ title: 'Exported', message: 'CSV file downloaded. Lot status updated.', type: 'success' });
      await loadData(lot.id);
    } catch (e) {
      addNotification({ title: 'Error', message: 'Export failed', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleScan = async () => {
    if (!lot || !scanInput) return;
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await cellTraceabilityService.scanSerial(lot.id, scanInput, actor);
      setScanInput('');
      await loadData(lot.id);
      addNotification({ title: 'Scanned', message: `Confirmed serial: ${scanInput}`, type: 'success' });
    } catch (e: any) {
      addNotification({ title: 'Scan Error', message: e.message, type: 'error' });
    }
  };

  const handleBulkScan = async () => {
    if (!lot || !isSuperAdmin) return;
    if (!window.confirm("Bulk confirm ALL serials for demo purposes?")) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await cellTraceabilityService.bulkMarkScanned(lot.id, actor);
      await loadData(lot.id);
      addNotification({ title: 'Batch Confirmed', message: 'All serials marked as scanned.', type: 'success' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Syncing traceable records...</div>;
  if (!lot) return <div className="p-20 text-center">Record not found in local store.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/trace/cells')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{lot.lotCode}</h2>
            <Badge variant={lot.status === 'READY_TO_BIND' ? 'success' : 'default'}>{lot.status}</Badge>
          </div>
          <p className="text-muted-foreground">{lot.supplierName} • Received {lot.receivedDate}</p>
        </div>
      </div>

      <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
        {[
          { id: 'overview', label: 'Lot Summary', icon: Info },
          { id: 'serialize', label: 'Serialization', icon: Fingerprint },
          { id: 'labels', label: 'Labels & Export', icon: Printer },
          { id: 'scan', label: 'Scan Confirm', icon: Scan }
        ].map(t => (
          <button 
            key={t.id} 
            className={`pb-2 border-b-2 capitalize transition-all flex items-center gap-2 ${activeTab === t.id ? 'border-primary text-primary font-bold' : 'border-transparent'}`} 
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'overview' && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Physical Lot Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Supplier Reference</label>
                  <p className="font-medium">{lot.supplierLotNo}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Quantity</label>
                  <p className="font-medium text-lg">{lot.quantityReceived.toLocaleString()} cells</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Chemistry / Form</label>
                  <p className="font-medium">{lot.chemistry} • {lot.formFactor}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Capacity Profile</label>
                  <p className="font-medium">{lot.capacityAh} Ah (Nominal)</p>
                </div>
                <div className="col-span-2 pt-4 border-t">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Current Progress</label>
                  <div className="mt-2 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Confirmed Scans</span>
                      <span className="font-mono">{lot.scannedCount} / {lot.generatedCount || lot.quantityReceived}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: `${(lot.scannedCount / (lot.generatedCount || lot.quantityReceived)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'serialize' && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Serialization Parameters</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {!canGenerate && (
                  <div className="p-4 bg-slate-50 border rounded text-sm flex gap-3 text-muted-foreground italic">
                    <ShieldCheck className="shrink-0 h-5 w-5" />
                    Only System Administrators are authorized to generate new serial identities.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Serial Prefix</label>
                    <Input 
                      disabled={!canGenerate || lot.status !== 'DRAFT'} 
                      value={genParams.prefix} 
                      onChange={e => setGenParams({...genParams, prefix: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Generation Count</label>
                    <Input 
                      type="number" 
                      disabled={!canGenerate || lot.status !== 'DRAFT'} 
                      value={genParams.count} 
                      onChange={e => setGenParams({...genParams, count: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Index</label>
                    <Input 
                      type="number" 
                      disabled={!canGenerate || lot.status !== 'DRAFT'} 
                      value={genParams.start} 
                      onChange={e => setGenParams({...genParams, start: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Output Format</label>
                    <select className="w-full p-2 border rounded bg-background" disabled>
                      <option>PREFIX-SEQ (####)</option>
                    </select>
                  </div>
                </div>
                
                {canGenerate && (
                  <div className="pt-4 border-t flex justify-end">
                    <Button 
                      onClick={handleGenerate} 
                      disabled={processing || genParams.count === 0}
                      variant={serials.length > 0 ? "outline" : "default"}
                    >
                      <Fingerprint className="mr-2 h-4 w-4" /> 
                      {serials.length > 0 ? "Regenerate IDs" : "Generate Identities"}
                    </Button>
                  </div>
                )}

                {serials.length > 0 && (
                  <div className="space-y-2 pt-4">
                    <h4 className="text-sm font-bold">First 5 Samples:</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {serials.slice(0, 5).map(s => (
                        <div key={s.serial} className="p-2 border rounded text-center font-mono text-xs bg-slate-50">{s.serial}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'labels' && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Labeling & Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                  <Printer className="h-12 w-12 text-muted-foreground opacity-20" />
                  <div>
                    <h3 className="font-bold">Cell Label Design</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Ready to export serialization list for industrial printers or print a local sample sheet.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="outline" disabled={serials.length === 0 || !canExport} onClick={handleExportCSV}>
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button disabled={serials.length === 0 || !canExport} onClick={() => window.print()}>
                      <LayoutGrid className="mr-2 h-4 w-4" /> Print Label Sheet
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold">Serial Manifest</h4>
                  <div className="max-h-[300px] overflow-y-auto border rounded">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>Serial</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Exported</TableHead>
                        </TableRow>
                      </TableHeader>
                      <tbody>
                        {serials.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center py-10">No serials generated yet.</TableCell></TableRow>
                        ) : (
                          serials.map(s => (
                            <TableRow key={s.serial}>
                              <TableCell className="font-mono text-xs">{s.serial}</TableCell>
                              <TableCell><Badge variant="outline" className="text-[10px]">{s.status}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{s.exportedAt ? new Date(s.exportedAt).toLocaleString() : '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'scan' && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scan className="h-5 w-5" /> Incoming Verification</CardTitle></CardHeader>
              <CardContent className="space-y-8">
                <div className="max-w-md mx-auto space-y-4">
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-center block">Enter/Scan Cell Serial to Confirm</label>
                     <div className="flex gap-2">
                       <Input 
                          placeholder="SCAN HERE..." 
                          className="text-lg h-12 text-center font-mono tracking-widest"
                          value={scanInput}
                          onChange={e => setScanInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleScan()}
                          disabled={!canScan || serials.length === 0}
                       />
                       <Button size="lg" onClick={handleScan} disabled={!canScan || !scanInput}>OK</Button>
                     </div>
                   </div>
                   <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Verified: {lot.scannedCount}</span>
                      <span>Total: {lot.generatedCount}</span>
                   </div>
                </div>

                <div className="pt-10 border-t space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Recent Scans</h4>
                    {isSuperAdmin && (
                      <Button variant="ghost" size="sm" onClick={handleBulkScan}>Bulk Mark (Demo)</Button>
                    )}
                  </div>
                  <div className="space-y-2">
                     {serials.filter(s => s.status === 'SCANNED').slice().reverse().slice(0, 5).map(s => (
                       <div key={s.serial} className="flex justify-between items-center p-3 border rounded-lg bg-emerald-50/50">
                          <span className="font-mono text-sm font-bold">{s.serial}</span>
                          <div className="flex items-center gap-2 text-xs text-emerald-600">
                             <CheckCircle size={14} /> Confirmed {new Date(s.scannedAt!).toLocaleTimeString()}
                          </div>
                       </div>
                     ))}
                     {serials.filter(s => s.status === 'SCANNED').length === 0 && (
                       <p className="text-center py-6 text-sm text-muted-foreground italic">Awaiting first scan confirmation.</p>
                     )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-lg">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Ledger Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Immutable Identities</p>
                            <p className="text-xs text-slate-400">All scanned serials are timestamped and cryptographically linked to Lot {lot.id}.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Database className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Persistence</p>
                            <p className="text-xs text-slate-400">Records stored in encrypted local cache (SafeStorage).</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('labels')}>
                        <Printer className="h-4 w-4" /> Print Labels
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => addNotification({title: 'Stub', message: 'Manual audit report generated.', type: 'info'})}>
                        <FileText className="h-4 w-4" /> Audit Report
                    </Button>
                </CardContent>
            </Card>

            <div className="p-4 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 flex items-start gap-3">
               <AlertCircle size={20} className="text-amber-500 shrink-0" />
               <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-tight">
                 Serialization is the anchor point for module-level traceability. Mismatches during assembly will trigger hard-gates.
               </p>
            </div>
        </div>
      </div>
    </div>
  );
}
