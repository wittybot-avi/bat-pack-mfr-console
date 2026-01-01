import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { packAssemblyService } from '../services/packAssemblyService';
import { EolTestRun, EolTestItem, PackInstance, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, ShieldCheck, CheckCircle, XCircle, Info, ClipboardList } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { STATUS_MAP } from '../services/workflowGuardrails';

export default function EolQaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [testRun, setTestRun] = useState<EolTestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const clusterId = currentCluster?.id || '';
  const isQA = clusterId === 'C3' || clusterId === 'CS';

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pid: string) => {
    setLoading(true);
    const p = await packAssemblyService.getPack(pid);
    if (!p) {
        addNotification({ title: 'Redirection', message: 'Pack record missing.', type: 'info' });
        navigate('/eol');
        return;
    }
    setPack(p);
    const actor = `${currentRole?.name} (${clusterId})`;
    const run = await eolQaService.createOrLoadTestRun(pid, actor);
    setTestRun(run);
    setLoading(false);
  };

  const updateItem = async (itemId: string, patch: Partial<EolTestItem>) => {
    if (!id || !isQA) return;
    try {
      const updatedRun = await eolQaService.updateTestItem(id, itemId, patch);
      setTestRun(updatedRun);
    } catch (e) {
      addNotification({ title: 'Error', message: 'Failed to update test result.', type: 'error' });
    }
  };

  const handleDecision = async (decision: 'PASS' | 'QUARANTINE' | 'SCRAP') => {
    if (!id) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await eolQaService.finalizeDecision(id, decision, { actor, notes: 'EOL Session Closure' });
      addNotification({ title: 'Success', message: `Pack disposition: ${decision}`, type: 'success' });
      await loadData(id);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !pack || !testRun) return <div className="p-20 text-center animate-pulse">Syncing QA record...</div>;

  const isFinalized = pack.status === PackStatus.PASSED || pack.status === PackStatus.QUARANTINED || pack.status === PackStatus.SCRAPPED;
  const canModify = isQA && !isFinalized;
  const totalRequired = testRun.items.filter(i => i.required).length;
  const runRequired = testRun.items.filter(i => i.required && i.status !== 'NOT_RUN').length;
  const isReadyForDecision = runRequired === totalRequired;
  const statusConfig = STATUS_MAP[pack.status] || STATUS_MAP.DRAFT;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/eol')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono">{pack.id}</h2>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Serial: {pack.packSerial || 'PENDING'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
               <ClipboardList size={20} className="text-slate-600" />
               <div className="flex-1">
                  <p className="text-xs uppercase font-bold text-muted-foreground">Checklist Progress</p>
                  <p className="text-2xl font-bold">{runRequired} / {totalRequired}</p>
               </div>
               <div className="w-1/2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(runRequired/totalRequired)*100}%` }} />
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b"><CardTitle className="text-lg">Test Matrix</CardTitle></CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader><TableRow><TableHead>Parameter</TableHead><TableHead>Measurement</TableHead><TableHead className="text-right">Result</TableHead></TableRow></TableHeader>
                  <tbody>
                      {testRun.items.map(item => (
                        <TableRow key={item.id}>
                           <TableCell><span className="text-sm font-semibold">{item.name}</span></TableCell>
                           <TableCell>
                              {item.unit ? (
                                <div className="flex items-center gap-2 max-w-[120px]">
                                   <Input className="h-8 text-xs" type="number" disabled={!canModify} value={item.measurement || ''} onChange={(e) => updateItem(item.id, { measurement: parseFloat(e.target.value) || 0 })} />
                                   <span className="text-xs text-muted-foreground">{item.unit}</span>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                   <Button variant={item.status === 'PASS' ? 'default' : 'outline'} size="sm" className="h-7 text-[10px]" disabled={!canModify} onClick={() => updateItem(item.id, { status: 'PASS' })}>OK</Button>
                                   <Button variant={item.status === 'FAIL' ? 'destructive' : 'outline'} size="sm" className="h-7 text-[10px]" disabled={!canModify} onClick={() => updateItem(item.id, { status: 'FAIL' })}>FAIL</Button>
                                </div>
                              )}
                           </TableCell>
                           <TableCell className="text-right">{item.status === 'PASS' ? <CheckCircle size={18} className="text-emerald-500 ml-auto" /> : item.status === 'FAIL' ? <XCircle size={18} className="text-rose-500 ml-auto" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200 ml-auto" />}</TableCell>
                        </TableRow>
                      ))}
                  </tbody>
               </Table>
            </CardContent>
          </Card>

          {!isFinalized && isQA && (
             <Card className="border-indigo-200 bg-indigo-50/10 border-2 border-dashed">
                <CardHeader><CardTitle className="text-base">Gated Disposition Hub</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   {!isReadyForDecision ? (
                      <div className="p-3 bg-amber-50 rounded text-xs text-amber-800 border border-amber-200 flex items-center gap-2">
                         <Info size={14} /> Disposition locked: Complete measurements for all required test parameters to proceed.
                      </div>
                   ) : (
                      <div className="flex gap-3">
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleDecision('PASS')} disabled={testRun.computedResult === 'FAIL'}>Certify Pass</Button>
                        <Button variant="outline" className="text-rose-600 border-rose-200" onClick={() => handleDecision('QUARANTINE')}>Quarantine</Button>
                        <Button variant="ghost" className="text-slate-500" onClick={() => handleDecision('SCRAP')}>Scrap Pack</Button>
                      </div>
                   )}
                </CardContent>
             </Card>
          )}

          {isFinalized && (
            <Card className="bg-slate-50 border-none">
               <CardContent className="p-10 text-center space-y-4">
                  <ShieldCheck className="h-16 w-16 mx-auto text-emerald-500 opacity-50" />
                  <h3 className="text-2xl font-bold">QA Record Locked</h3>
                  <div className="max-w-md mx-auto bg-white p-4 rounded border text-sm text-left">
                     <p><strong>Decision:</strong> {pack.status.replace(/_/g, ' ')}</p>
                     <p><strong>Analyst:</strong> {testRun.decisionBy}</p>
                     <p><strong>Timestamp:</strong> {new Date(testRun.decisionAt!).toLocaleString()}</p>
                  </div>
               </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
