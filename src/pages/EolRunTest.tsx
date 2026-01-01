import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { packAssemblyService } from '../services/packAssemblyService';
import { PackInstance, EolTestRun, EolTestItem } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Play, CheckCircle, XCircle, Info, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StageHeader } from '../components/SopGuidedUX';

export default function EolRunTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [testRun, setTestRun] = useState<EolTestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const clusterId = currentCluster?.id || '';
  const canRun = ['C3', 'CS'].includes(clusterId);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pid: string) => {
    setLoading(true);
    try {
      const p = await packAssemblyService.getPack(pid);
      if (!p) {
        navigate('/assure/eol/queue');
        return;
      }
      setPack(p);
      const actor = `${currentRole?.name} (${clusterId})`;
      const run = await eolQaService.createOrLoadTestRun(pid, actor);
      setTestRun(run);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id || !canRun) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await eolQaService.startEolTest(id, actor);
      await loadData(id);
      addNotification({ title: 'Session Active', message: 'Test cycle initialized.', type: 'info' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateItem = async (itemId: string, patch: Partial<EolTestItem>) => {
    if (!id || !canRun) return;
    try {
      const updated = await eolQaService.updateTestItem(id, itemId, patch);
      setTestRun(updated);
    } catch (e) {
      addNotification({ title: 'Error', message: 'Failed to update measurement.', type: 'error' });
    }
  };

  const handleFinalize = async (decision: 'PASS' | 'FAIL') => {
    if (!id || !canRun) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await eolQaService.finalizeDecision(id, decision, { 
        actor, 
        notes: decision === 'PASS' ? 'Passed automated test suite.' : 'Failed electrical threshold check.'
      });
      addNotification({ title: 'Complete', message: `Result: ${decision}`, type: decision === 'PASS' ? 'success' : 'warning' });
      navigate(`/assure/eol/details/${id}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !pack || !testRun) return <div className="p-20 text-center animate-pulse">Initializing test bench...</div>;

  const isTesting = pack.eolStatus === 'IN_TEST';
  const allMeasured = testRun.items.filter(i => i.required).every(i => i.status !== 'NOT_RUN');

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S7-RUN"
        title="Live Test Execution"
        objective="Perform direct measurement of electrical parameters against SKU blueprint thresholds."
        entityLabel={pack.id}
        status={pack.status}
        diagnostics={{ route: '/assure/eol/run', entityId: pack.id }}
      />

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
           <Button variant="ghost" size="sm" onClick={() => navigate(`/assure/eol/details/${id}`)} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Exit Session
            </Button>
            {!isTesting && (
                <Button onClick={handleStart} className="gap-2 bg-indigo-600 shadow-lg shadow-indigo-500/20 h-12 px-8">
                    <Play size={18} fill="currentColor" /> Start Test Cycle
                </Button>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-base">Test Sequence Matrix</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Parameter</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {testRun.items.map(item => (
                                <TableRow key={item.id} className={!isTesting ? 'opacity-40' : ''}>
                                    <TableCell className="font-semibold text-sm">{item.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">{item.threshold || 'Binary'}</TableCell>
                                    <TableCell>
                                        {item.unit ? (
                                            <div className="flex items-center gap-2">
                                                <Input 
                                                    disabled={!isTesting} 
                                                    type="number" 
                                                    className="h-8 w-24 text-xs font-mono" 
                                                    value={item.measurement || ''} 
                                                    onChange={e => handleUpdateItem(item.id, { measurement: parseFloat(e.target.value) || 0 })}
                                                />
                                                <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1">
                                                <Button size="sm" variant={item.status === 'PASS' ? 'default' : 'outline'} className={`h-7 text-[10px] ${item.status === 'PASS' ? 'bg-emerald-600' : ''}`} onClick={() => handleUpdateItem(item.id, { status: 'PASS' })} disabled={!isTesting}>OK</Button>
                                                <Button size="sm" variant={item.status === 'FAIL' ? 'destructive' : 'outline'} className="h-7 text-[10px]" onClick={() => handleUpdateItem(item.id, { status: 'FAIL' })} disabled={!isTesting}>ERR</Button>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.status === 'PASS' ? <CheckCircle size={16} className="text-emerald-500 ml-auto" /> : item.status === 'FAIL' ? <XCircle size={16} className="text-rose-500 ml-auto" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200 ml-auto" />}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardHeader className="border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Disposition Decision</CardTitle></CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-indigo-400 mt-0.5" />
                            <p className="text-[10px] text-slate-400 uppercase font-bold leading-relaxed">
                                Measurements are linked to Station ID: {localStorage.getItem('eol_station_id') || 'EOL-01'}.
                            </p>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-slate-800">
                             <Button 
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 border-none font-bold shadow-lg shadow-emerald-500/10" 
                                disabled={!isTesting || !allMeasured || processing}
                                onClick={() => handleFinalize('PASS')}
                             >
                                 Sign PASS Certificate
                             </Button>
                             <Button 
                                variant="outline" 
                                className="w-full h-12 text-white border-slate-700 hover:bg-slate-800 font-bold" 
                                disabled={!isTesting || processing}
                                onClick={() => handleFinalize('FAIL')}
                             >
                                 Mark Non-conforming
                             </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center text-center space-y-2 opacity-60">
                    <ShieldCheck size={24} className="text-emerald-500" />
                    <p className="text-[10px] font-black uppercase text-slate-500">Quality Lock Active</p>
                    <p className="text-[9px] text-slate-400">Session becomes immutable once decision is signed.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}