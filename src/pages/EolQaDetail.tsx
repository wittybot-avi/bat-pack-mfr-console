
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { packAssemblyService } from '../services/packAssemblyService';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { EolTestRun, EolTestItem, PackInstance, PackStatus, ModuleInstance } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, ShieldCheck, ShieldAlert, CheckCircle, XCircle, Play, Save, History, Box, Info, AlertTriangle, ChevronRight, ClipboardList, Trash2 } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function EolQaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [testRun, setTestRun] = useState<EolTestRun | null>(null);
  const [linkedModules, setLinkedModules] = useState<ModuleInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeDecision, setActiveDecision] = useState<'PASS' | 'QUARANTINE' | 'SCRAP' | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [ncrId, setNcrId] = useState('');

  // RBAC
  const clusterId = currentCluster?.id || '';
  const isSuperAdmin = clusterId === 'CS';
  const isQA = clusterId === 'C3' || isSuperAdmin;

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pid: string) => {
    setLoading(true);
    try {
      const p = await packAssemblyService.getPack(pid);
      if (p) {
        setPack(p);
        const actor = `${currentRole?.name} (${clusterId})`;
        const run = await eolQaService.createOrLoadTestRun(pid, actor);
        setTestRun(run);

        // Sidebar Context
        const mods = await Promise.all(p.moduleIds.map(mid => moduleAssemblyService.getModule(mid)));
        setLinkedModules(mods.filter(m => !!m) as ModuleInstance[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  const handleFinalDecision = async () => {
    if (!id || !activeDecision) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await eolQaService.finalizeDecision(id, activeDecision, {
        actor,
        notes: decisionNotes,
        ncrId,
        reason: activeDecision === 'QUARANTINE' ? 'QA Inspection Failure' : undefined
      });
      addNotification({ title: 'Success', message: `Pack marked as ${activeDecision}.`, type: 'success' });
      await loadData(id);
      setActiveDecision(null);
    } catch (e: any) {
      addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Initializing test environment...</div>;
  if (!pack || !testRun) return <div className="p-20 text-center">Pack not found in EOL scope.</div>;

  const isFinalized = pack.status === PackStatus.PASSED || pack.status === PackStatus.QUARANTINED || pack.status === PackStatus.SCRAPPED;
  const canModify = isQA && !isFinalized;
  const totalRequired = testRun.items.filter(i => i.required).length;
  const runRequired = testRun.items.filter(i => i.required && i.status !== 'NOT_RUN').length;
  const isReadyForDecision = runRequired === totalRequired;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/assure/eol')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono">{pack.id}</h2>
            <Badge variant={pack.status === PackStatus.PASSED ? 'success' : 'default'}>
              {pack.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Serial: {pack.packSerial || 'Pending'} • SKU: {pack.skuCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          
          {/* RESULTS SUMMARY CARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="p-4 flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle size={20} />
                   </div>
                   <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Passed</p>
                      <p className="text-2xl font-bold">{testRun.items.filter(i => i.status === 'PASS').length}</p>
                   </div>
                </CardContent>
             </Card>
             <Card className="bg-rose-50/50 dark:bg-rose-950/20">
                <CardContent className="p-4 flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                      <XCircle size={20} />
                   </div>
                   <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Failed</p>
                      <p className="text-2xl font-bold">{testRun.items.filter(i => i.status === 'FAIL').length}</p>
                   </div>
                </CardContent>
             </Card>
             <Card className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-4 flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <ClipboardList size={20} />
                   </div>
                   <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Progress</p>
                      <p className="text-2xl font-bold">{runRequired} / {totalRequired}</p>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* CHECKLIST TABLE */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-lg">Test Plan Checklist</CardTitle>
               <Badge variant="outline" className="text-xs">Procedure Rev: P-2024-V2</Badge>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                  <TableHeader>
                      <TableRow className="bg-slate-50/50">
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Test Parameter</TableHead>
                          <TableHead>Threshold</TableHead>
                          <TableHead>Measurement</TableHead>
                          <TableHead className="text-right">Result</TableHead>
                      </TableRow>
                  </TableHeader>
                  <tbody>
                      {testRun.items.map((item, idx) => (
                        <TableRow key={item.id} className="group">
                           <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                 <span className="text-sm font-semibold">{item.name}</span>
                                 <span className="text-[10px] text-muted-foreground uppercase">{item.group}</span>
                              </div>
                           </TableCell>
                           <TableCell className="font-mono text-xs text-muted-foreground">{item.threshold || 'Binary'}</TableCell>
                           <TableCell>
                              {item.unit ? (
                                <div className="flex items-center gap-2 max-w-[120px]">
                                   <Input 
                                      className="h-8 font-mono text-xs" 
                                      type="number" 
                                      disabled={!canModify}
                                      value={item.measurement || ''} 
                                      onChange={(e) => updateItem(item.id, { measurement: parseFloat(e.target.value) || 0 })}
                                   />
                                   <span className="text-xs text-muted-foreground">{item.unit}</span>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                   <Button 
                                      variant={item.status === 'PASS' ? 'default' : 'outline'} 
                                      size="sm" 
                                      className="h-7 text-[10px]"
                                      disabled={!canModify}
                                      onClick={() => updateItem(item.id, { status: 'PASS' })}
                                   >OK</Button>
                                   <Button 
                                      variant={item.status === 'FAIL' ? 'destructive' : 'outline'} 
                                      size="sm" 
                                      className="h-7 text-[10px]"
                                      disabled={!canModify}
                                      onClick={() => updateItem(item.id, { status: 'FAIL' })}
                                   >FAIL</Button>
                                </div>
                              )}
                           </TableCell>
                           <TableCell className="text-right">
                              {item.status === 'PASS' ? <CheckCircle size={18} className="text-emerald-500 ml-auto" /> : 
                               item.status === 'FAIL' ? <XCircle size={18} className="text-rose-500 ml-auto" /> : 
                               <div className="h-4 w-4 rounded-full border-2 border-slate-200 ml-auto" />}
                           </TableCell>
                        </TableRow>
                      ))}
                  </tbody>
               </Table>
            </CardContent>
          </Card>

          {/* DECISION HUB */}
          {!isFinalized && isQA && (
             <Card className="border-indigo-200 bg-indigo-50/10">
                <CardHeader><CardTitle className="text-base">Operational Disposition</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   {!isReadyForDecision && (
                      <div className="p-3 bg-amber-50 rounded text-xs text-amber-800 border border-amber-200 flex items-center gap-2">
                         <Info size={14} /> Finish all required tests to unlock disposition controls.
                      </div>
                   )}
                   
                   <div className="flex flex-wrap gap-3">
                      <Button 
                        disabled={!isReadyForDecision || testRun.computedResult === 'FAIL'} 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setActiveDecision('PASS')}
                      >
                         <ShieldCheck className="mr-2 h-4 w-4" /> Certify Pass
                      </Button>
                      <Button variant="outline" className="text-rose-600 border-rose-200" onClick={() => setActiveDecision('QUARANTINE')}>
                         <ShieldAlert className="mr-2 h-4 w-4" /> Quarantine Unit
                      </Button>
                      <Button variant="ghost" className="text-slate-500" onClick={() => setActiveDecision('SCRAP')}>
                         <Trash2 className="mr-2 h-4 w-4" /> Scrap Pack
                      </Button>
                   </div>
                </CardContent>
             </Card>
          )}

          {/* FINALIZED SUMMARY */}
          {isFinalized && (
            <Card className={`border-none ${pack.status === PackStatus.PASSED ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'}`}>
               <CardContent className="p-10 text-center space-y-4">
                  <div className="flex justify-center">
                    {pack.status === PackStatus.PASSED ? <ShieldCheck size={64} className="text-emerald-500" /> : <ShieldAlert size={64} className="text-rose-500" />}
                  </div>
                  <h3 className="text-2xl font-bold">QA Finalized: {pack.status.replace(/_/g, ' ')}</h3>
                  <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-4 rounded border text-sm text-left">
                     <p><strong>Decision By:</strong> {testRun.decisionBy}</p>
                     <p><strong>Decision At:</strong> {new Date(testRun.decisionAt!).toLocaleString()}</p>
                     {testRun.notes && <p className="mt-2 text-muted-foreground italic">"{testRun.notes}"</p>}
                  </div>
                  {pack.status === PackStatus.PASSED && (
                    <Button onClick={() => navigate('/dispatch')}>Go to Dispatch List</Button>
                  )}
               </CardContent>
            </Card>
          )}

        </div>

        {/* SIDEBAR CONTEXT */}
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Lineage Snapshot</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-xs">
                    <div className="space-y-2">
                       <p className="font-bold flex items-center gap-2"><Box size={14} className="text-primary"/> Linked Modules</p>
                       <div className="pl-6 space-y-1">
                          {linkedModules.map(m => (
                            <div key={m.id} className="flex justify-between border-b pb-1 font-mono">
                               <span>{m.id}</span>
                               <span className="text-muted-foreground">{m.boundCellSerials.length} Cells</span>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="flex justify-between font-bold pt-2">
                       <span>Total Cells Counted:</span>
                       <span className="text-primary">{linkedModules.reduce((acc, curr) => acc + curr.boundCellSerials.length, 0)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-none">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Ledger Assurance</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <History className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold">Auditability</p>
                            <p className="text-[10px] text-slate-400">Measurements are immutable once submitted. Signature required for overrides.</p>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                         <Button variant="ghost" size="sm" className="w-full gap-2 text-indigo-400" onClick={() => navigate(`/trace/lineage/${pack.id}`)}>
                            <ChevronRight className="h-4 w-4" /> Trace Genealogy
                         </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Decision Modal */}
      {activeDecision && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <Card className="w-full max-w-md shadow-2xl">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                        {activeDecision === 'PASS' ? <ShieldCheck className="text-emerald-500" /> : <ShieldAlert className="text-rose-500" />}
                        Confirm {activeDecision}
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    {activeDecision === 'QUARANTINE' && (
                        <div className="space-y-2">
                           <label className="text-sm font-medium">NCR ID / Report Reference</label>
                           <Input placeholder="NCR-2024-XXXX" value={ncrId} onChange={e => setNcrId(e.target.value.toUpperCase())} />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">QA Analyst Notes</label>
                        <textarea 
                            className="w-full h-32 p-2 border rounded bg-background text-sm" 
                            placeholder="Provide rationale for decision..."
                            value={decisionNotes}
                            onChange={e => setDecisionNotes(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setActiveDecision(null)}>Cancel</Button>
                        <Button 
                            className={activeDecision === 'PASS' ? 'bg-emerald-600' : 'bg-rose-600'} 
                            onClick={handleFinalDecision}
                            disabled={processing || (activeDecision === 'QUARANTINE' && !ncrId)}
                        >Finalize Record</Button>
                    </div>
                 </CardContent>
             </Card>
         </div>
      )}
    </div>
  );
}
