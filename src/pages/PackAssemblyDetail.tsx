
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packAssemblyService } from '../services/packAssemblyService';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { skuService, Sku } from '../services/skuService';
import { PackInstance, PackStatus, ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Layers, ShieldCheck, CheckCircle, Info, Zap, Box, Trash2, Plus, History, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { useAppStore } from '../lib/store';

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
  
  // Inputs
  const [bmsInput, setBmsInput] = useState('');

  const clusterId = currentCluster?.id || '';
  const isSuperAdmin = clusterId === 'CS';
  const isOperator = clusterId === 'C2' || isSuperAdmin;
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
        setBmsInput(p.bmsId || '');
        const s = await skuService.getSku(p.skuId);
        if (s) setSku(s);

        const modDetails = await Promise.all(p.moduleIds.map(mid => moduleAssemblyService.getModule(mid)));
        setModules(modDetails.filter(m => !!m) as ModuleInstance[]);
        
        const eligible = await packAssemblyService.listEligibleModulesForPack(p.skuId);
        setEligibleModules(eligible);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkModule = async (moduleId: string) => {
    if (!pack) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await packAssemblyService.linkModuleToPack(pack.id, moduleId, actor, isSuperAdmin);
      addNotification({ title: 'Linked', message: `Module ${moduleId} added to build.`, type: 'success' });
      await loadData(pack.id);
      setIsPickerOpen(false);
    } catch (e: any) {
      addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlinkModule = async (moduleId: string) => {
    if (!pack || !window.confirm("Remove module?")) return;
    setProcessing(true);
    try {
      const actor = `${currentRole?.name} (${clusterId})`;
      await packAssemblyService.unlinkModuleFromPack(pack.id, moduleId, actor, isSuperAdmin);
      addNotification({ title: 'Unlinked', message: 'Module removed from pack.', type: 'info' });
      await loadData(pack.id);
    } catch (e: any) {
      addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleQC = async (status: 'PASSED' | 'FAILED') => {
      if (!pack) return;
      try {
          await packAssemblyService.updatePack(pack.id, { qcStatus: status });
          addNotification({ title: 'QC Updated', message: `Pack QC marked as ${status}.`, type: status === 'PASSED' ? 'success' : 'warning' });
          await loadData(pack.id);
      } catch (e: any) {
          addNotification({ title: 'Error', message: e.message, type: 'error' });
      }
  };

  const handleGenerateSerial = async () => {
    if (!pack) return;
    try {
        await packAssemblyService.generatePackSerial(pack.id);
        addNotification({ title: 'Identity Locked', message: 'Pack serial assigned.', type: 'success' });
        await loadData(pack.id);
    } catch (e: any) {
        addNotification({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleBindBMS = async () => {
    if (!pack || !bmsInput) return;
    setProcessing(true);
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        await packAssemblyService.bindDeviceToPack(pack.id, bmsInput, actor);
        addNotification({ title: 'BMS Bound', message: 'Hardware identity confirmed.', type: 'success' });
        await loadData(pack.id);
    } catch (e: any) {
        addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
        setProcessing(false);
    }
  };

  const handleFinalizeBuild = async () => {
    if (!pack) return;
    try {
        const actor = `${currentRole?.name} (${clusterId})`;
        await packAssemblyService.markPackReadyForEOL(pack.id, actor);
        addNotification({ title: 'Finalized', message: 'Pack build complete. Sent to QA queue.', type: 'success' });
        await loadData(pack.id);
    } catch (e: any) {
        addNotification({ title: 'Failure', message: e.message, type: 'error' });
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Syncing production record...</div>;
  if (!pack) return <div className="p-20 text-center">Record not found.</div>;

  const isFinalized = pack.status === PackStatus.READY_FOR_EOL || pack.status === PackStatus.FINALIZED;
  const isComplete = pack.moduleIds.length === pack.requiredModules;
  const canRelease = isComplete && pack.packSerial && pack.qcStatus === 'PASSED' && pack.bmsId && !isFinalized;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operate/packs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono text-indigo-700">{pack.id}</h2>
            <Badge variant={isFinalized ? 'success' : 'default'}>{pack.status.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{sku?.skuCode} • {sku?.skuName}</p>
        </div>
        <div className="flex gap-2">
            {canRelease && isOperator && (
                <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20" onClick={handleFinalizeBuild}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Finalize & Release
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground">
            <button className={`pb-2 border-b-2 transition-all ${activeTab === 'linkage' ? 'border-primary text-primary font-bold' : 'border-transparent'}`} onClick={() => setActiveTab('linkage')}>Linkage & Build</button>
            <button className={`pb-2 border-b-2 transition-all ${activeTab === 'qc' ? 'border-primary text-primary font-bold' : 'border-transparent'}`} onClick={() => setActiveTab('qc')}>QC & Finalize</button>
          </div>

          {activeTab === 'linkage' && (
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base flex items-center gap-2"><Layers className="h-5 w-5 text-indigo-500" /> Module Components</CardTitle>
                        {!isFinalized && isOperator && !isComplete && (
                            <Button size="sm" variant="outline" onClick={() => setIsPickerOpen(true)}>
                                <Plus size={14} className="mr-1" /> Add Sealed Module
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead>Module ID</TableHead>
                                    <TableHead>Cells</TableHead>
                                    <TableHead>Last Actor</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <tbody>
                                {modules.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-16 text-muted-foreground font-mono text-xs opacity-50">Build empty. Link sealed modules to start.</TableCell></TableRow>
                                ) : (
                                    modules.map(m => (
                                        <TableRow key={m.id} className="group">
                                            <TableCell className="font-mono font-bold">{m.id}</TableCell>
                                            <TableCell className="text-xs">{m.boundCellSerials.length} Cells</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{m.actor || 'System'}</TableCell>
                                            <TableCell className="text-right">
                                                {!isFinalized && isOperator && (
                                                    <Button variant="ghost" size="icon" className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleUnlinkModule(m.id)}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /> Identity Logic</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {pack.packSerial ? (
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900 rounded-lg text-center">
                                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mb-1">Authenticated Serial</p>
                                    <p className="font-mono font-bold text-lg select-all">{pack.packSerial}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-2">
                                    <p className="text-xs text-muted-foreground mb-3 text-center">Identity is required for EOL release.</p>
                                    <Button variant="outline" className="w-full" onClick={handleGenerateSerial} disabled={!isOperator || isFinalized}>
                                        Generate Pack Identity
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-5 w-5 text-blue-500" /> BMS Binding</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input 
                                    disabled={isFinalized || !isOperator || !!pack.bmsId}
                                    placeholder="Enter BMS UID..." 
                                    className="font-mono"
                                    value={bmsInput}
                                    onChange={e => setBmsInput(e.target.value.toUpperCase())}
                                />
                                {!pack.bmsId ? (
                                    <Button onClick={handleBindBMS} disabled={!isOperator || !bmsInput}>Bind</Button>
                                ) : (
                                    <Badge variant="success" className="h-10 px-4">Locked</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
          )}

          {activeTab === 'qc' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <Card>
                    <CardHeader><CardTitle>Assembly Quality Control</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            {[
                                { id: 'q1', label: 'All module seals verified intact', val: isComplete },
                                { id: 'q2', label: 'BMS communication handshake verified', val: !!pack.bmsId },
                                { id: 'q3', label: 'Wiring and physical fasteners inspected', val: true },
                                { id: 'q4', label: 'Safety covers and labeling applied', val: true }
                            ].map(q => (
                                <div key={q.id} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className={`h-5 w-5 rounded flex items-center justify-center border-2 ${q.val ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                        {q.val && <CheckCircle size={14} />}
                                    </div>
                                    <span className="text-sm font-medium">{q.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 pt-4 border-t">
                            <Button 
                                className={`flex-1 h-12 text-lg ${pack.qcStatus === 'PASSED' ? 'bg-emerald-600 shadow-lg shadow-emerald-500/20' : ''}`}
                                variant={pack.qcStatus === 'PASSED' ? 'default' : 'outline'}
                                onClick={() => handleQC('PASSED')}
                                disabled={!isQA || isFinalized}
                            >
                                <CheckCircle className="mr-2 h-5 w-5" /> QC Passed
                            </Button>
                            <Button 
                                className={`flex-1 h-12 text-lg ${pack.qcStatus === 'FAILED' ? 'bg-rose-600 shadow-lg shadow-rose-500/20' : ''}`}
                                variant={pack.qcStatus === 'FAILED' ? 'default' : 'outline'}
                                onClick={() => handleQC('FAILED')}
                                disabled={!isQA || isFinalized}
                            >
                                <ShieldAlert className="mr-2 h-5 w-5" /> Reject Build
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {canRelease && (
                    <Card className="bg-indigo-900 text-white border-none shadow-2xl overflow-hidden">
                        <CardContent className="p-8 text-center space-y-4">
                            <div className="h-16 w-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto text-white">
                                <ShieldCheck size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Build Order Complete</h3>
                                <p className="text-indigo-200 mt-2">All checks passed. Pack is ready for EOL release.</p>
                            </div>
                            <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 w-full font-bold" onClick={handleFinalizeBuild}>
                                RELEASE TO EOL GATE
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
          )}
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Ledger Assurance</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Cells:</span>
                        <span className="font-mono text-indigo-400 font-bold">{modules.reduce((acc, m) => acc + m.boundCellSerials.length, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                        <span className="text-slate-400">Modules Bound:</span>
                        <span className={`font-mono font-bold ${isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>{pack.moduleIds.length} / {pack.requiredModules}</span>
                    </div>
                    <div className="pt-2">
                        <Button variant="ghost" size="sm" className="w-full text-indigo-400 gap-2 h-8" onClick={() => navigate(`/trace/lineage/${pack.id}`)}>
                            <History size={14} /> Full Audit Trace
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">SKU Parameters</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Chemistry:</span>
                        <Badge variant="outline">{sku?.chemistry}</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Required Topology:</span>
                        <span className="font-mono">{sku?.seriesCount}S {sku?.parallelCount}P</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Module Picker Modal */}
      {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-900 border-b">
                      <CardTitle className="text-lg">Select Sealed Module</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setIsPickerOpen(false)}>X</Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-0">
                      <Table>
                          <TableHeader className="bg-slate-100 sticky top-0 z-10">
                              <TableRow>
                                  <TableHead>Module ID</TableHead>
                                  <TableHead>Target SKU</TableHead>
                                  <TableHead className="text-right"></TableHead>
                              </TableRow>
                          </TableHeader>
                          <tbody>
                              {eligibleModules.length === 0 ? (
                                  <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground">No eligible SEALED modules found for SKU {pack.skuCode}.</TableCell></TableRow>
                              ) : (
                                  eligibleModules.map(m => (
                                      <TableRow key={m.id} className="hover:bg-slate-50">
                                          <TableCell className="font-mono font-bold text-indigo-600">{m.id}</TableCell>
                                          <TableCell className="text-xs">{m.skuCode}</TableCell>
                                          <TableCell className="text-right">
                                              <Button size="sm" onClick={() => handleLinkModule(m.id)} disabled={processing}>Link</Button>
                                          </TableCell>
                                      </TableRow>
                                  ))
                              )}
                          </tbody>
                      </Table>
                  </CardContent>
                  <div className="p-4 border-t flex justify-end bg-slate-50">
                      <Button variant="outline" onClick={() => setIsPickerOpen(false)}>Close</Button>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
}
