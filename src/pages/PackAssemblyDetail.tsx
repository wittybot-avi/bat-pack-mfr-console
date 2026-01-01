import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packAssemblyService } from '../services/packAssemblyService';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { PackInstance, PackStatus, ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Layers, ShieldCheck, Cpu, Box, Trash2, Database } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails, STATUS_MAP } from '../services/workflowGuardrails';
import { GatedAction, NextStepPanel } from '../components/WorkflowGuards';

export default function PackAssemblyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [sku, setSku] = useState<Sku | null>(null);
  const [modules, setModules] = useState<ModuleInstance[]>([]);
  const [eligibleModules, setEligibleModules] = useState<ModuleInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('linkage');
  const [bmsInput, setBmsInput] = useState('');

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pid: string) => {
    setLoading(true);
    const p = await packAssemblyService.getPack(pid);
    if (!p) {
        addNotification({ title: 'Redirection', message: 'Build order not found.', type: 'info' });
        navigate('/operate/packs');
        return;
    }
    setPack(p);
    setBmsInput(p.bmsId || '');
    const s = await skuService.getSku(p.skuId);
    if (s) setSku(s);
    const modDetails = await Promise.all(p.moduleIds.map(mid => moduleAssemblyService.getModule(mid)));
    setModules(modDetails.filter(m => !!m) as ModuleInstance[]);
    const eligible = await packAssemblyService.listEligibleModulesForPack(p.skuId);
    setEligibleModules(eligible);
    setLoading(false);
  };

  if (loading || !pack) return <div className="p-20 text-center animate-pulse">Syncing build order...</div>;

  const guards = workflowGuardrails.getPackGuardrail(pack, clusterId);
  const nextStep = workflowGuardrails.getNextRecommendedStep(pack, 'PACK');
  const statusConfig = STATUS_MAP[pack.status] || STATUS_MAP.DRAFT;

  const handleLinkModule = async (moduleId: string) => {
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await packAssemblyService.linkModuleToPack(pack.id, moduleId, actor, clusterId === 'CS');
      addNotification({ title: 'Linked', message: `Module added to build.`, type: 'success' });
      await loadData(pack.id);
      setIsPickerOpen(false);
    } catch (e: any) {
      addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleQC = async (status: 'PASSED' | 'FAILED') => {
      await packAssemblyService.updatePack(pack.id, { qcStatus: status });
      addNotification({ title: 'QC Updated', message: `Assembly QC marked ${status}`, type: status === 'PASSED' ? 'success' : 'warning' });
      loadData(pack.id);
  };

  const handleBindBMS = async () => {
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        await packAssemblyService.bindDeviceToPack(pack.id, bmsInput, actor);
        addNotification({ title: 'BMS Bound', message: 'Hardware identity confirmed.', type: 'success' });
        loadData(pack.id);
    } catch (e: any) {
        addNotification({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleFinalize = async () => {
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        await packAssemblyService.markPackReadyForEOL(pack.id, actor);
        addNotification({ title: 'Finalized', message: 'Build order released to QA.', type: 'success' });
        loadData(pack.id);
    } catch (e: any) {
        addNotification({ title: 'Failure', message: e.message, type: 'error' });
    }
  };

  const isComplete = pack.status === PackStatus.READY_FOR_EOL || pack.status === PackStatus.FINALIZED;
  const boundCount = pack.moduleIds.length;
  const targetCount = pack.requiredModules || 1;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operate/packs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono text-indigo-700">{pack.id}</h2>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{sku?.skuCode} Main Assembly</p>
        </div>
        <div className="flex gap-2">
            <GatedAction 
                guard={guards.finalize} 
                onClick={handleFinalize} 
                label="Finalize Build" 
                icon={ShieldCheck} 
                className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <NextStepPanel step={nextStep} />

          <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto pb-px">
            <button className={`pb-2 border-b-2 transition-all ${activeTab === 'linkage' ? 'border-primary text-primary font-bold' : 'border-transparent'}`} onClick={() => setActiveTab('linkage')}>Build Order</button>
            <button className={`pb-2 border-b-2 transition-all ${activeTab === 'qc' ? 'border-primary text-primary font-bold' : 'border-transparent'}`} onClick={() => setActiveTab('qc')}>Identity & QC</button>
          </div>

          {activeTab === 'linkage' && (
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base">Sub-Assemblies ({boundCount}/{targetCount})</CardTitle>
                        {!isComplete && <Button size="sm" variant="outline" onClick={() => setIsPickerOpen(true)}>Link Module</Button>}
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader><TableRow><TableHead>Module ID</TableHead><TableHead>Target Cells</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <tbody>
                                {modules.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-16 text-muted-foreground italic">No modules linked.</TableCell></TableRow>
                                ) : (
                                    modules.map(m => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-mono font-bold">{m.id}</TableCell>
                                            <TableCell className="text-xs">{m.targetCells} Cells</TableCell>
                                            <TableCell className="text-right">
                                                {!isComplete && (
                                                    <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => packAssemblyService.unlinkModuleFromPack(pack.id, m.id, 'Operator').then(() => loadData(pack.id))}>
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

          {activeTab === 'qc' && (
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Identity & Assembly Verification</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">BMS UID Binding</label>
                                <div className="flex gap-2">
                                    <Input disabled={isComplete || !!pack.bmsId} placeholder="Scan BMS..." value={bmsInput} onChange={e => setBmsInput(e.target.value.toUpperCase())} />
                                    {!pack.bmsId && <Button onClick={handleBindBMS}>Bind</Button>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pack Serial</label>
                                {pack.packSerial ? (
                                    <div className="p-2 border rounded font-mono font-bold text-center bg-slate-50">{pack.packSerial}</div>
                                ) : (
                                    <Button variant="outline" className="w-full" onClick={() => packAssemblyService.generatePackSerial(pack.id).then(() => loadData(pack.id))}>Assign Serial</Button>
                                )}
                            </div>
                        </div>
                        <div className="pt-6 border-t flex gap-4">
                            <Button className={`flex-1 h-12 ${pack.qcStatus === 'PASSED' ? 'bg-emerald-600' : ''}`} variant={pack.qcStatus === 'PASSED' ? 'default' : 'outline'} onClick={() => handleQC('PASSED')} disabled={isComplete}>QC PASS</Button>
                            <Button className={`flex-1 h-12 ${pack.qcStatus === 'FAILED' ? 'bg-rose-600' : ''}`} variant={pack.qcStatus === 'FAILED' ? 'default' : 'outline'} onClick={() => handleQC('FAILED')} disabled={isComplete}>QC FAIL</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Assurance Ledger</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                        <Database className="h-5 w-5 text-indigo-400 mt-0.5" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Main assembly registry ensures all sub-components are validated against the master blueprint.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between border-b"><CardTitle className="text-lg">Link Sealed Module</CardTitle><Button variant="ghost" size="icon" onClick={() => setIsPickerOpen(false)}>X</Button></CardHeader>
                  <CardContent className="flex-1 overflow-auto p-0">
                      <Table>
                          <TableHeader className="bg-slate-100 sticky top-0 z-10"><TableRow><TableHead>Module ID</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                          <tbody>
                              {eligibleModules.map(m => (
                                  <TableRow key={m.id} className="hover:bg-slate-50"><TableCell className="font-mono font-bold text-indigo-600">{m.id}</TableCell><TableCell className="text-right"><Button size="sm" onClick={() => handleLinkModule(m.id)}>Link</Button></TableCell></TableRow>
                              ))}
                          </tbody>
                      </Table>
                  </CardContent>
              </Card>
          </div>
      )}
    </div>
  );
}
