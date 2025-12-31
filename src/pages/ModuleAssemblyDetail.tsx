
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { ModuleInstance, ModuleStatus, CellBindingRecord } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, ShieldCheck, Trash2, CheckCircle, Info, Scan, Lock, Database, History, User, Clock } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function ModuleAssemblyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [module, setModule] = useState<ModuleInstance | null>(null);
  const [bindings, setBindings] = useState<CellBindingRecord[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [activeTab, setActiveTab] = useState('binding');
  
  const scanRef = useRef<HTMLInputElement>(null);

  const clusterId = currentCluster?.id || '';
  const isSuperAdmin = clusterId === 'CS';
  const isOperator = clusterId === 'C2' || isSuperAdmin;

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (mid: string) => {
    setLoading(true);
    try {
      const m = await moduleAssemblyService.getModule(mid);
      if (m) {
        setModule(m);
        const b = await moduleAssemblyService.listBindingsByModule(mid);
        setBindings(b);
        const e = await moduleAssemblyService.getLineageEvents(mid);
        setEvents(e.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        const s = await skuService.getSku(m.skuId);
        if (s) setSku(s);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!module || !scanInput || processing) return;

    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.bindCellToModule(module.id, scanInput.trim(), actor, isSuperAdmin);
      addNotification({ title: 'Success', message: `Cell ${scanInput} bound.`, type: 'success' });
      setScanInput('');
      await loadData(module.id);
      setTimeout(() => scanRef.current?.focus(), 100);
    } catch (err: any) {
      addNotification({ title: 'Binding Error', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUnbind = async (serial: string) => {
    if (!module || !window.confirm(`Unbind ${serial}?`)) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.unbindCellFromModule(module.id, serial, actor, isSuperAdmin);
      addNotification({ title: 'Unbound', message: 'Cell removed.', type: 'info' });
      await loadData(module.id);
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSeal = async () => {
    if (!module || !window.confirm("Seal module? This locks bindings.")) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.sealModule(module.id, actor);
      addNotification({ title: 'Sealed', message: 'Module assembly complete.', type: 'success' });
      await loadData(module.id);
    } catch (err: any) {
      addNotification({ title: 'Seal Failed', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading work order...</div>;
  if (!module) return <div className="p-20 text-center">Module not found.</div>;

  const isSealed = module.status === ModuleStatus.SEALED || module.status === ModuleStatus.CONSUMED;
  const progress = Math.min(100, (module.boundCellSerials.length / module.targetCells) * 100);
  const isReadyToSeal = module.boundCellSerials.length === module.targetCells && !isSealed;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operate/modules')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono text-primary">{module.id}</h2>
            <Badge variant={isSealed ? 'success' : 'default'}>{module.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{sku?.skuCode} • {sku?.skuName}</p>
        </div>
        <div className="flex gap-2">
            {isReadyToSeal && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" onClick={handleSeal} disabled={processing}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Seal Module
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground">
            <button className={`pb-2 border-b-2 transition-all ${activeTab === 'binding' ? 'border-primary text-primary font-bold' : 'border-transparent'}`} onClick={() => setActiveTab('binding')}>Assembly & Binding</button>
            <button className={`pb-2 border-b-2 transition-all ${activeTab === 'audit' ? 'border-primary text-primary font-bold' : 'border-transparent'}`} onClick={() => setActiveTab('audit')}>Audit Trail</button>
          </div>

          {activeTab === 'binding' && (
            <div className="space-y-6">
               <Card>
                <CardContent className="p-6">
                   <div className="flex justify-between items-end mb-4">
                      <div className="space-y-1">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Target Cell Population</p>
                          <p className="text-3xl font-mono font-bold">{module.boundCellSerials.length} / {module.targetCells}</p>
                      </div>
                      <Badge variant="outline" className="text-lg font-mono">{progress.toFixed(0)}%</Badge>
                   </div>
                   <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                   </div>
                </CardContent>
              </Card>

              {!isSealed && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-primary"><Scan className="h-5 w-5" /> Cell Binding Entry</CardTitle></CardHeader>
                  <CardContent>
                      <form onSubmit={handleScan} className="flex gap-3">
                          <Input 
                            ref={scanRef}
                            placeholder="Scan Cell Serial Number..." 
                            className="text-xl h-14 font-mono border-2 focus-visible:ring-primary bg-white dark:bg-slate-950"
                            value={scanInput}
                            onChange={e => setScanInput(e.target.value.toUpperCase())}
                            autoFocus
                          />
                          <Button size="lg" className="h-14 px-8 text-lg" disabled={!isOperator || !scanInput || processing} type="submit">
                              {processing ? '...' : 'BIND CELL'}
                          </Button>
                      </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-lg">Bound Components Ledger</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                          <TableRow>
                              <TableHead>Serial</TableHead>
                              <TableHead>Lot</TableHead>
                              <TableHead>Bound At</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                      </TableHeader>
                      <tbody>
                          {bindings.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic font-mono text-xs opacity-50">Empty ledger. Awaiting scans.</TableCell></TableRow>
                          ) : (
                            bindings.slice().reverse().map(b => (
                              <TableRow key={b.serial} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{b.serial}</TableCell>
                                <TableCell className="text-xs font-medium">{b.lotCode}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{new Date(b.boundAt).toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    {!isSealed && (
                                        <Button variant="ghost" size="icon" className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleUnbind(b.serial)} disabled={processing}>
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                      </tbody>
                   </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'audit' && (
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-indigo-500" /> Event Chronology</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800 pl-8">
                        {events.length === 0 ? <p className="text-sm text-muted-foreground italic">No events recorded.</p> : 
                          events.map(e => (
                            <div key={e.id} className="relative">
                                <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-[10px] uppercase">{e.type}</Badge>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> {new Date(e.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm font-medium">{e.message}</p>
                                    <p className="text-xs text-slate-400 flex items-center gap-1"><User size={10} /> {e.actor}</p>
                                </div>
                            </div>
                          ))
                        }
                    </div>
                </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Context Intelligence</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Database className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div className="text-xs">
                            <p className="font-bold">Atomic Linkage</p>
                            <p className="text-slate-400 mt-1 opacity-80">All serials are locked to this WO ID in the immutable trace cache.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-slate-800 pt-3">
                        <Info className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div className="text-xs">
                            <p className="font-bold">Topology Match</p>
                            <p className="text-slate-400 mt-1 opacity-80">{sku?.seriesCount}S / {sku?.parallelCount}P Arrangement Required.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Trace Links</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs" onClick={() => navigate(`/trace/lineage/${module.id}`)}>
                        <History className="h-4 w-4" /> View Visual Genealogy
                    </Button>
                    {sku && (
                        <Button variant="outline" className="w-full justify-start gap-2 h-9 text-xs" onClick={() => navigate(`/sku/${sku.id}`)}>
                            <Info className="h-4 w-4" /> SKU Specification
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
