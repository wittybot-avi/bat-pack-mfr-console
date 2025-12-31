
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { moduleService } from '../services/moduleService';
import { skuService, Sku } from '../services/skuService';
import { ModuleInstance, ModuleStatus, CellBindingRecord } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, Save, ShieldCheck, Zap, Info, Archive, Trash2, CheckCircle, AlertTriangle, ChevronRight, Scan, Lock, Unlock, Database, Activity } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function ModuleAssemblyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [module, setModule] = useState<ModuleInstance | null>(null);
  const [bindings, setBindings] = useState<CellBindingRecord[]>([]);
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [scanInput, setScanInput] = useState('');
  
  const scanRef = useRef<HTMLInputElement>(null);

  // RBAC Helpers
  const clusterId = currentCluster?.id || '';
  const isSuperAdmin = clusterId === 'CS';
  const isOperator = clusterId === 'C2' || isSuperAdmin;
  const isQA = clusterId === 'C3' || isSuperAdmin;

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
      addNotification({ title: 'Success', message: `Serial ${scanInput} bound to module.`, type: 'success' });
      setScanInput('');
      await loadData(module.id);
      // Refocus after scan
      setTimeout(() => scanRef.current?.focus(), 100);
    } catch (err: any) {
      addNotification({ title: 'Binding Error', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUnbind = async (serial: string) => {
    if (!module || !window.confirm(`Unbind ${serial} from this module?`)) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.unbindCellFromModule(module.id, serial, actor, isSuperAdmin);
      addNotification({ title: 'Unbound', message: 'Cell returned to lot pool.', type: 'info' });
      await loadData(module.id);
    } catch (err: any) {
      addNotification({ title: 'Error', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSeal = async () => {
    if (!module || !window.confirm("Seal this module? This locks configuration for standard operators.")) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.sealModule(module.id, actor);
      addNotification({ title: 'Sealed', message: 'Module assembly workflow complete.', type: 'success' });
      await loadData(module.id);
    } catch (err: any) {
      addNotification({ title: 'Seal Failed', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRaiseException = async () => {
      if (!module) return;
      const msg = window.prompt("Enter exception details:");
      if (!msg) return;
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.raiseException(module.id, 'module', msg, 'MED', actor);
      addNotification({ title: 'Exception Logged', message: 'QA review flag set.', type: 'warning' });
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Syncing work order...</div>;
  if (!module) return <div className="p-20 text-center">Module work order not found.</div>;

  const isSealed = module.status === ModuleStatus.SEALED;
  const canBind = isOperator && !isSealed;
  const progress = Math.min(100, (module.boundCellSerials.length / module.targetCells) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operate/modules')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono">{module.id}</h2>
            <Badge variant={isSealed ? 'success' : 'default'}>{module.status}</Badge>
            {isSealed && <Lock className="h-3 w-3 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">{sku?.skuCode} • {sku?.skuName}</p>
        </div>
        <div className="flex gap-2">
            {!isSealed && module.boundCellSerials.length === module.targetCells && (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSeal} disabled={processing || !isOperator}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Seal Module
                </Button>
            )}
            {isQA && (
                <Button variant="outline" className="text-amber-600 border-amber-200" onClick={handleRaiseException}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> Raise Exception
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROGRESS CARD */}
          <Card>
            <CardContent className="p-6">
               <div className="flex justify-between items-end mb-4">
                  <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Binding Progress</p>
                      <p className="text-2xl font-bold font-mono">{module.boundCellSerials.length} / {module.targetCells}</p>
                  </div>
                  <Badge variant="outline">{progress.toFixed(0)}% Complete</Badge>
               </div>
               <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                    style={{ width: `${progress}%` }} 
                  />
               </div>
            </CardContent>
          </Card>

          {/* SCAN INTERFACE */}
          {!isSealed && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scan className="h-5 w-5" /> Cell Entry</CardTitle></CardHeader>
              <CardContent>
                  <form onSubmit={handleScan} className="flex gap-3">
                      <Input 
                        ref={scanRef}
                        disabled={!canBind || processing}
                        placeholder="Scan or enter cell serial..." 
                        className="text-lg h-12 font-mono"
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value.toUpperCase())}
                        autoFocus
                      />
                      <Button size="lg" disabled={!canBind || !scanInput || processing} type="submit">
                          {processing ? '...' : 'BIND'}
                      </Button>
                  </form>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                      <Info className="h-3 w-3" /> Standard validation active: Serial exists, Scanned state, Chemistry Match.
                  </div>
              </CardContent>
            </Card>
          )}

          {/* BOUND CELLS TABLE */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Bound Components</CardTitle></CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Serial</TableHead>
                          <TableHead>Lot Reference</TableHead>
                          <TableHead>Bound At</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                  </TableHeader>
                  <tbody>
                      {bindings.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">No cells bound to this record.</TableCell></TableRow>
                      ) : (
                        bindings.slice().reverse().map(b => (
                          <TableRow key={b.serial} className="group">
                            <TableCell className="font-mono text-sm font-bold">{b.serial}</TableCell>
                            <TableCell className="text-xs">
                                <div className="flex flex-col">
                                    <span className="font-medium text-primary">{b.lotCode}</span>
                                    <span className="text-[10px] text-muted-foreground">{b.chemistry} Lot</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {new Date(b.boundAt).toLocaleTimeString()}
                            </TableCell>
                            <TableCell className="text-right">
                                {(!isSealed || isSuperAdmin) && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleUnbind(b.serial)}
                                        disabled={processing}
                                    >
                                        <Trash2 className="h-4 w-4" />
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

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-lg">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Ledger Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Immutable Linkage</p>
                            <p className="text-xs text-slate-400">Binding creates a permanent cryptographic link between cell and module ID.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Database className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Atomic Persistence</p>
                            <p className="text-xs text-slate-400">Serial state updated to BOUND globally across Traceability modules.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Blueprint Constraints</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target SKU:</span>
                        <span className="font-bold">{sku?.skuCode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Required Chem:</span>
                        <Badge variant="outline">{sku?.chemistry}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cell Topology:</span>
                        <span className="font-mono text-xs">{sku?.seriesCount}S / {sku?.parallelCount}P</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                         <Button variant="ghost" size="sm" className="w-full gap-2 text-primary" onClick={() => navigate(`/trace/lineage/${module.id}`)}>
                            <Activity className="h-4 w-4" /> Audit Lineage
                         </Button>
                    </div>
                </CardContent>
            </Card>

            {isSealed && (
                <div className="p-4 border-2 border-emerald-100 bg-emerald-50 rounded-lg flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-tighter">Assembly Sealed</p>
                        <p className="text-[10px] text-emerald-700 leading-tight">Configuration is locked. Module is available for Pack assembly integration.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
