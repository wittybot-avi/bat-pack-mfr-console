
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleService } from '../services/moduleService';
import { skuService, Sku } from '../services/skuService';
import { ModuleInstance, ModuleStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, Save, ShieldCheck, Zap, Info, Archive, Trash2, CheckCircle, AlertTriangle, ChevronRight, Scan, FileDown, Upload } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function ModuleAssemblyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [module, setModule] = useState<ModuleInstance | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');

  const isNew = id === 'new';

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    setLoading(true);
    const skuList = await skuService.listSkus();
    setSkus(skuList);

    if (!isNew && id) {
      const mod = await moduleService.getModule(id);
      if (mod) {
        setModule(mod);
        setSelectedSkuId(mod.skuId);
        // Determine step based on status
        if (mod.status === ModuleStatus.SEALED) setStep(3);
        else if (mod.boundCellSerials.length > 0) setStep(2);
      }
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    const sku = skus.find(s => s.id === selectedSkuId);
    if (!sku) return;

    setProcessing(true);
    try {
      const mod = await moduleService.createModule({
        skuId: sku.id,
        skuCode: sku.skuCode,
        targetCells: sku.seriesCount * sku.parallelCount,
        createdBy: currentRole?.name || 'User'
      });
      setModule(mod);
      navigate(`/operate/modules/${mod.id}`, { replace: true });
      setStep(2);
    } catch (e) {
      addNotification({ title: 'Error', message: 'Failed to create work order.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddSerial = (serial: string) => {
    if (!module || !serial) return;
    const clean = serial.trim().toUpperCase();
    if (module.boundCellSerials.includes(clean)) {
      addNotification({ title: 'Duplicate', message: 'Serial already bound.', type: 'error' });
      return;
    }
    if (module.boundCellSerials.length >= module.targetCells) {
      addNotification({ title: 'Limit Reached', message: 'Target count achieved.', type: 'warning' });
      return;
    }
    const newList = [...module.boundCellSerials, clean];
    updateModuleLocally({ boundCellSerials: newList, status: ModuleStatus.IN_PROGRESS });
    setScanInput('');
  };

  const handleBulkAdd = () => {
    if (!module || !bulkInput) return;
    const lines = bulkInput.split('\n').map(l => l.trim().toUpperCase()).filter(l => !!l);
    const existing = new Set(module.boundCellSerials);
    const uniqueNew = lines.filter(l => !existing.has(l));
    
    if (uniqueNew.length + module.boundCellSerials.length > module.targetCells) {
      addNotification({ title: 'Overload', message: 'Bulk list exceeds target cells.', type: 'error' });
      return;
    }

    const newList = [...module.boundCellSerials, ...uniqueNew];
    updateModuleLocally({ boundCellSerials: newList, status: ModuleStatus.IN_PROGRESS });
    setBulkInput('');
    addNotification({ title: 'Success', message: `Added ${uniqueNew.length} serials.`, type: 'success' });
  };

  const removeSerial = (index: number) => {
    if (!module) return;
    const newList = module.boundCellSerials.filter((_, i) => i !== index);
    updateModuleLocally({ boundCellSerials: newList });
  };

  const updateModuleLocally = (patch: Partial<ModuleInstance>) => {
    if (!module) return;
    const updated = { ...module, ...patch };
    setModule(updated);
    moduleService.updateModule(module.id, updated);
  };

  const handleSeal = async () => {
    if (!module) return;
    setProcessing(true);
    try {
      await moduleService.sealModule(module.id);
      setStep(3);
      setModule({ ...module, status: ModuleStatus.SEALED });
      addNotification({ title: 'Sealed', message: 'Module assembly complete.', type: 'success' });
    } catch (e: any) {
      addNotification({ title: 'Validation Failed', message: e.message, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading work order...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operate/modules')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{isNew ? 'New Assembly Order' : module?.id}</h2>
            {module && <Badge variant={module.status === ModuleStatus.SEALED ? 'success' : 'default'}>{module.status}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{module?.skuCode || 'Drafting new sub-assembly'}</p>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1 gap-4">
              <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-300'}`} />
              <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-300'}`} />
              <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-slate-300'}`} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: SKU Selection */}
          {step === 1 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Archive className="h-5 w-5" /> Step 1: Select Blueprint</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Specification</label>
                  <select 
                    className="w-full p-2 border rounded bg-background"
                    value={selectedSkuId}
                    onChange={(e) => setSelectedSkuId(e.target.value)}
                  >
                    <option value="">Choose a SKU...</option>
                    {skus.map(sku => (
                      <option key={sku.id} value={sku.id}>{sku.skuCode} - {sku.skuName} ({sku.seriesCount}S {sku.parallelCount}P)</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleCreate} disabled={!selectedSkuId || processing}>
                    Configure Work Order <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Cell Assignment */}
          {step === 2 && module && (
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5" /> Step 2: Bind Cells</CardTitle>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-mono">{module.boundCellSerials.length} / {module.targetCells}</span>
                   <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(module.boundCellSerials.length / module.targetCells) * 100}%` }} />
                   </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-sm font-medium flex items-center gap-2"><Scan size={14} /> Scan Serial</label>
                         <div className="flex gap-2">
                            <Input 
                              value={scanInput} 
                              onChange={e => setScanInput(e.target.value)} 
                              onKeyDown={e => e.key === 'Enter' && handleAddSerial(scanInput)}
                              placeholder="C100..."
                            />
                            <Button variant="outline" onClick={() => handleAddSerial(scanInput)}>Add</Button>
                         </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t">
                         <label className="text-sm font-medium flex items-center gap-2"><Upload size={14} /> Bulk Entry</label>
                         <textarea 
                            className="w-full h-32 p-2 border rounded bg-background font-mono text-xs" 
                            placeholder="Paste serials here (one per line)..."
                            value={bulkInput}
                            onChange={e => setBulkInput(e.target.value)}
                         />
                         <div className="flex justify-between items-center">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs"><FileDown size={12}/> Import CSV</Button>
                            <Button size="sm" onClick={handleBulkAdd}>Add Bulk List</Button>
                         </div>
                      </div>
                   </div>

                   <div className="border rounded-md bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                      <div className="p-2 border-b font-semibold text-xs uppercase text-muted-foreground flex justify-between">
                         <span>Bound Serials</span>
                         <span>{module.boundCellSerials.length} total</span>
                      </div>
                      <div className="flex-1 overflow-y-auto h-[250px] p-2 space-y-1">
                         {module.boundCellSerials.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">No serials bound.</div>
                         ) : (
                            module.boundCellSerials.map((s, i) => (
                               <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-950 p-1 px-2 rounded border text-xs font-mono">
                                  <span>{s}</span>
                                  <button onClick={() => removeSerial(i)} className="text-rose-500 hover:text-rose-700"><Trash2 size={12} /></button>
                               </div>
                            ))
                         )}
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t flex justify-end">
                   <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={handleSeal}
                    disabled={module.boundCellSerials.length !== module.targetCells || processing}
                   >
                     Validate & Seal Module
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Sealed / Finalized */}
          {step === 3 && module && (
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/10">
               <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <CheckCircle size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">Module Sealed Successfully</h3>
                  <p className="max-w-md text-muted-foreground">
                     The component record has been updated. This module is now available to be linked into a Pack Assembly work order.
                  </p>
                  <div className="flex gap-4 pt-4">
                     <Button variant="outline" onClick={() => navigate('/operate/modules')}>Back to List</Button>
                     <Button onClick={() => navigate('/operate/packs/new')}>Link into New Pack</Button>
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
                    <span className="text-muted-foreground">Work Order:</span>
                    <span className="font-mono font-bold">{module?.id || 'New Draft'}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Target SKU:</span>
                    <span className="font-bold">{module?.skuCode || '-'}</span>
                 </div>
                 <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Target Cells:</span>
                    <span className="font-bold">{module?.targetCells || 0}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Bound Cells:</span>
                    <span className="font-bold">{module?.boundCellSerials.length || 0}</span>
                 </div>
              </CardContent>
           </Card>

           <div className="p-4 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><AlertTriangle size={12}/> Station Hard-Gate</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                 Assembly line controller (PLC) will physically prevent station release until "Validate & Seal" is executed in the console. 
                 Mismatched counts will trigger an automated QA Hold.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
