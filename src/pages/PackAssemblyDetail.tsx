
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packService } from '../services/packService';
import { moduleService } from '../services/moduleService';
import { skuService, Sku } from '../services/skuService';
import { PackInstance, PackStatus, ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
// Fix: Added missing 'Archive' import
import { ArrowLeft, Save, ShieldCheck, Zap, Info, Layers, CheckCircle, AlertTriangle, ChevronRight, Cpu, FileCheck, Archive } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';

export default function PackAssemblyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [availableModules, setAvailableModules] = useState<ModuleInstance[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [bmsSerial, setBmsSerial] = useState('');
  const [firmware, setFirmware] = useState('v3.1.0-STABLE');

  const isNew = id === 'new';

  // RBAC for QA
  const canPerformQC = canDo(currentCluster?.id || '', ScreenId.PACK_ASSEMBLY_DETAIL, 'A');

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    setLoading(true);
    const skuList = await skuService.listSkus();
    setSkus(skuList);

    const mods = await moduleService.listModules();
    setAvailableModules(mods.filter(m => m.status === ModuleStatus.SEALED));

    if (!isNew && id) {
      const p = await packService.getPack(id);
      if (p) {
        setPack(p);
        setSelectedSkuId(p.skuId);
        setBmsSerial(p.bmsSerial);
        setFirmware(p.firmwareVersion || 'v3.1.0-STABLE');
        // Determine step based on status
        if (p.status === PackStatus.FINALIZED) setStep(4);
        else if (p.packSerial) setStep(3);
        else if (p.moduleIds.length > 0) setStep(2);
      }
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    const sku = skus.find(s => s.id === selectedSkuId);
    if (!sku) return;

    setProcessing(true);
    try {
      const p = await packService.createPack({
        skuId: sku.id,
        skuCode: sku.skuCode,
        createdBy: currentRole?.name || 'User'
      });
      setPack(p);
      navigate(`/operate/packs/${p.id}`, { replace: true });
      setStep(2);
    } catch (e) {
      addNotification({ title: 'Error', message: 'Failed to create work order.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const toggleModuleLink = (modId: string) => {
    if (!pack) return;
    const newList = pack.moduleIds.includes(modId)
      ? pack.moduleIds.filter(mid => mid !== modId)
      : [...pack.moduleIds, modId];
    updatePackLocally({ moduleIds: newList });
  };

  const updatePackLocally = (patch: Partial<PackInstance>) => {
    if (!pack) return;
    const updated = { ...pack, ...patch };
    setPack(updated);
    packService.updatePack(pack.id, updated);
  };

  const handleGenerateSerial = () => {
    if (!pack) return;
    const serial = `SN-${pack.skuCode}-${Date.now().toString().slice(-6)}`;
    updatePackLocally({ packSerial: serial });
    setStep(3);
  };

  const handleFinalize = async () => {
    if (!pack) return;
    setProcessing(true);
    try {
      await packService.updatePack(pack.id, { bmsSerial, firmwareVersion: firmware });
      await packService.finalizePack(pack.id);
      setStep(4);
      setPack({ ...pack, status: PackStatus.FINALIZED, bmsSerial, firmwareVersion: firmware });
      addNotification({ title: 'Finalized', message: 'Pack assembly complete and record generated.', type: 'success' });
    } catch (e: any) {
      addNotification({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleQCToggle = () => {
     if (!pack) return;
     const newStatus = pack.qcStatus === 'PASSED' ? 'PENDING' : 'PASSED';
     updatePackLocally({ qcStatus: newStatus });
     addNotification({ title: 'QC Updated', message: `Pack status marked as ${newStatus}`, type: 'info' });
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading work order...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operate/packs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{isNew ? 'New Pack Build' : pack?.id}</h2>
            {pack && <Badge variant={pack.status === PackStatus.FINALIZED ? 'success' : 'default'}>{pack.status}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{pack?.skuCode || 'Initiating final assembly'}</p>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-2 w-2 rounded-full ${step >= i ? 'bg-primary' : 'bg-slate-300'}`} />
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: SKU Selection */}
          {step === 1 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5" /> Step 1: Target SKU</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Master Blueprint</label>
                  <select 
                    className="w-full p-2 border rounded bg-background"
                    value={selectedSkuId}
                    onChange={(e) => setSelectedSkuId(e.target.value)}
                  >
                    <option value="">Choose a SKU...</option>
                    {skus.map(sku => (
                      <option key={sku.id} value={sku.id}>{sku.skuCode} - {sku.skuName}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleCreate} disabled={!selectedSkuId || processing}>
                    Open Work Order <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Module Linkage */}
          {step === 2 && pack && (
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2"><Archive className="h-5 w-5" /> Step 2: Link Sub-Assemblies</CardTitle>
                <div className="flex items-center gap-2">
                   <Badge variant="outline">{pack.moduleIds.length} Linked</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-md overflow-hidden">
                   <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                         <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Module ID</TableHead>
                            <TableHead>Cells</TableHead>
                            <TableHead>Sealed At</TableHead>
                         </TableRow>
                      </TableHeader>
                      <tbody>
                         {availableModules.length === 0 ? (
                           <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No SEALED modules available for linkage.</TableCell></TableRow>
                         ) : (
                           availableModules.map(m => (
                             <TableRow key={m.id} className="cursor-pointer" onClick={() => toggleModuleLink(m.id)}>
                               <TableCell>
                                  <input type="checkbox" checked={pack.moduleIds.includes(m.id)} readOnly className="rounded border-slate-300" />
                               </TableCell>
                               <TableCell className="font-mono text-xs">{m.id}</TableCell>
                               <TableCell>{m.boundCellSerials.length}</TableCell>
                               <TableCell className="text-xs text-muted-foreground">{new Date(m.updatedAt).toLocaleString()}</TableCell>
                             </TableRow>
                           ))
                         )}
                      </tbody>
                   </Table>
                </div>

                <div className="pt-4 flex justify-end">
                   <Button onClick={handleGenerateSerial} disabled={pack.moduleIds.length === 0}>
                     Assign Pack Serial <ChevronRight className="ml-2 h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: BMS & Finalization */}
          {step === 3 && pack && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5" /> Step 3: BMS & Control</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-sm font-medium">BMS Serial Number</label>
                      <Input value={bmsSerial} onChange={e => setBmsSerial(e.target.value)} placeholder="Scan BMS identifier..." />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium">Firmware Version</label>
                      <select className="w-full p-2 border rounded bg-background" value={firmware} onChange={e => setFirmware(e.target.value)}>
                        <option value="v3.1.0-STABLE">v3.1.0-STABLE</option>
                        <option value="v3.2.0-BETA">v3.2.0-BETA</option>
                        <option value="v2.9.9-LTS">v2.9.9-LTS</option>
                      </select>
                   </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md border text-sm flex gap-4 items-center">
                   <ShieldCheck className="text-primary h-8 w-8 shrink-0" />
                   <div>
                      <p className="font-bold">Final Validation</p>
                      <p className="text-xs text-muted-foreground">Clicking finalize will generate the immutable Battery record and update inventory status.</p>
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                   <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                   <Button onClick={handleFinalize} disabled={!bmsSerial || processing}>Finalize Pack Assembly</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: Success */}
          {step === 4 && pack && (
            <Card className="bg-emerald-50/10 border-emerald-200">
               <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <FileCheck size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">Pack Finalized</h3>
                  <div className="bg-white dark:bg-slate-950 p-4 rounded border font-mono text-sm w-full max-sm:text-xs">
                     <div className="flex justify-between border-b pb-2 mb-2"><span>Serial:</span> <span className="font-bold">{pack.packSerial}</span></div>
                     <div className="flex justify-between border-b pb-2 mb-2"><span>BMS:</span> <span>{pack.bmsSerial}</span></div>
                     <div className="flex justify-between"><span>FW:</span> <span>{pack.firmwareVersion}</span></div>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <Button variant="outline" onClick={() => navigate('/operate/packs')}>Return to List</Button>
                     <Button onClick={() => navigate(`/batteries/${pack.packSerial}`)}>View Life-cycle Record</Button>
                  </div>
               </CardContent>
            </Card>
          )}

        </div>

        <div className="space-y-6">
           <Card>
              <CardHeader><CardTitle className="text-base">Assembly Context</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Pack ID:</span>
                    <span className="font-mono font-bold">{pack?.id || 'New Draft'}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-bold">{pack?.skuCode || '-'}</span>
                 </div>
                 <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Modules Linked:</span>
                    <span className="font-bold">{pack?.moduleIds.length || 0}</span>
                 </div>
                 {pack?.packSerial && (
                   <div className="flex flex-col gap-1 border-t pt-2">
                      <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Pack Serial</span>
                      <span className="font-mono text-primary font-bold bg-primary/5 p-2 rounded border border-primary/20 text-center">{pack.packSerial}</span>
                   </div>
                 )}
              </CardContent>
           </Card>

           {/* QA Section */}
           {!isNew && pack && (
             <Card className={pack.qcStatus === 'PASSED' ? 'border-emerald-200' : ''}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">QC Verification</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      <Badge variant={pack.qcStatus === 'PASSED' ? 'success' : 'outline'}>{pack.qcStatus}</Badge>
                   </div>
                   {canPerformQC ? (
                     <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleQCToggle}>
                        {pack.qcStatus === 'PASSED' ? 'Revoke Approval' : 'Mark QC Passed'}
                     </Button>
                   ) : (
                     <p className="text-[10px] text-muted-foreground text-center italic">Only QA role cluster can update QC status.</p>
                   )}
                </CardContent>
             </Card>
           )}

           <div className="p-4 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <Info size={20} className="text-primary shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                 Assembly completion triggers automated registration in the Fleet Management module. 
                 Ensure BMS communication is verified before finalize.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
