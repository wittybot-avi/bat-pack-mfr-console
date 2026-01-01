import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { ModuleInstance, ModuleStatus, CellBindingRecord } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, ShieldCheck, Trash2, Info, Scan, History, Database } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails, STATUS_MAP } from '../services/workflowGuardrails';
import { GatedAction, NextStepPanel } from '../components/WorkflowGuards';

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
  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (mid: string) => {
    setLoading(true);
    const m = await moduleAssemblyService.getModule(mid);
    if (!m) {
        addNotification({ title: 'Redirection', message: 'Module record missing.', type: 'info' });
        navigate('/operate/modules');
        return;
    }
    setModule(m);
    const b = await moduleAssemblyService.listBindingsByModule(mid);
    setBindings(b);
    const s = await skuService.getSku(m.skuId);
    if (s) setSku(s);
    setLoading(false);
  };

  if (loading || !module) return <div className="p-20 text-center animate-pulse">Loading assembly data...</div>;

  const guards = workflowGuardrails.getModuleGuardrail(module, clusterId);
  const nextStep = workflowGuardrails.getNextRecommendedStep(module, 'MODULE');
  const statusConfig = STATUS_MAP[module.status] || STATUS_MAP.DRAFT;
  const progress = Math.min(100, (module.boundCellSerials.length / module.targetCells) * 100);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!module || !scanInput || processing) return;

    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.bindCellToModule(module.id, scanInput.trim(), actor, clusterId === 'CS');
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

  const handleSeal = async () => {
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await moduleAssemblyService.sealModule(module.id, actor);
      addNotification({ title: 'Sealed', message: 'Module work order finalized.', type: 'success' });
      await loadData(module.id);
    } catch (err: any) {
      addNotification({ title: 'Seal Failed', message: err.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operate/modules')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono text-primary">{module.id}</h2>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{sku?.skuCode} Blueprint</p>
        </div>
        <div className="flex gap-2">
            <GatedAction 
                guard={guards.seal} 
                onClick={handleSeal} 
                label="Seal Module" 
                icon={ShieldCheck} 
                loading={processing}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <NextStepPanel step={nextStep} />

          <Card>
            <CardContent className="p-6">
               <div className="flex justify-between items-end mb-4">
                  <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Target Population</p>
                      <p className="text-3xl font-mono font-bold">{module.boundCellSerials.length} / {module.targetCells}</p>
                  </div>
                  <Badge variant="outline" className="text-lg font-mono">{progress.toFixed(0)}%</Badge>
               </div>
               <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
               </div>
            </CardContent>
          </Card>

          {module.status === ModuleStatus.IN_PROGRESS && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2 text-primary"><Scan className="h-5 w-5" /> Component Entry</CardTitle></CardHeader>
              <CardContent>
                  <form onSubmit={handleScan} className="flex gap-3">
                      <Input 
                        ref={scanRef}
                        placeholder="Scan Cell Serial..." 
                        className="text-xl h-14 font-mono border-2 bg-white dark:bg-slate-950"
                        value={scanInput}
                        onChange={e => setScanInput(e.target.value.toUpperCase())}
                        disabled={!guards.bind.allowed || processing}
                      />
                      <GatedAction 
                        guard={guards.bind} 
                        onClick={handleScan} 
                        label="BIND" 
                        className="h-14 px-8 text-lg" 
                        loading={processing}
                      />
                  </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">Ledger</CardTitle></CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow><TableHead>Serial</TableHead><TableHead>Lot</TableHead><TableHead>Timestamp</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                  </TableHeader>
                  <tbody>
                      {bindings.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-mono text-xs">Empty registry.</TableCell></TableRow>
                      ) : (
                        bindings.slice().reverse().map(b => (
                          <TableRow key={b.serial} className="group">
                            <TableCell className="font-mono text-sm font-bold text-indigo-600">{b.serial}</TableCell>
                            <TableCell className="text-xs">{b.lotCode}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(b.boundAt).toLocaleTimeString()}</TableCell>
                            <TableCell className="text-right">
                                {module.status === ModuleStatus.IN_PROGRESS && (
                                    <Button variant="ghost" size="icon" className="text-rose-500 opacity-0 group-hover:opacity-100" onClick={() => moduleAssemblyService.unbindCellFromModule(module.id, b.serial, 'Operator').then(() => loadData(module.id))}>
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

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Ledger Assurance</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                        <Database className="h-5 w-5 text-blue-400 mt-0.5" />
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Records locked via operator signature. Non-volatile persistence active.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
