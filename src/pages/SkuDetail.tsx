import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Save, ShieldCheck, Zap, Info, Layers, History, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function SkuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [sku, setSku] = useState<Sku | null>(null);
  const [versions, setVersions] = useState<Sku[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSku(id);
    }
  }, [id]);

  const loadSku = async (skuId: string) => {
    setLoading(true);
    try {
      const data = await skuService.getSku(skuId);
      if (data) {
        setSku(data);
        const allVersions = await skuService.getVersions(data.skuCode);
        setVersions(allVersions);
      }
    } catch (e) {
      console.error("Failed to load SKU", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-muted-foreground">Synchronizing blueprint data...</div>;

  if (!sku) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertCircle className="h-16 w-16 text-rose-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">Blueprint Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-8">The requested SKU configuration ID does not exist in local cache.</p>
        <Button onClick={() => navigate('/sku')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </Button>
      </div>
    );
  }

  const isViewOnly = !['C2', 'CS', 'C4'].includes(currentCluster?.id || '');

  const handleActivate = async () => {
    try {
      const updated = await skuService.updateSku(sku.id, { status: 'ACTIVE' });
      setSku(updated);
      addNotification({ title: 'Blueprint Activated', message: `${sku.skuCode} is now the primary spec.`, type: 'success' });
    } catch (e) {
      addNotification({ title: 'Activation Failed', message: 'Failed to update blueprint status.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sku')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-bold tracking-tight">{sku.skuCode}</h2>
            <Badge variant={sku.status === 'ACTIVE' ? 'success' : 'secondary'} className="px-3">{sku.status}</Badge>
            <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-900 border-indigo-200 dark:border-indigo-800">Version {sku.version}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{sku.skuName}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {sku.status === 'DRAFT' && !isViewOnly && (
            <Button variant="outline" onClick={handleActivate} className="flex-1 md:flex-none border-emerald-500 text-emerald-600 hover:bg-emerald-50">
              <CheckCircle className="mr-2 h-4 w-4" /> Activate Spec
            </Button>
          )}
          {!isViewOnly && (
            <Button className="flex-1 md:flex-none shadow-indigo-200 dark:shadow-none">
              <Save className="mr-2 h-4 w-4" /> Update Blueprint
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto pb-px">
            {['overview', 'electrical', 'physical', 'rules', 'versions'].map((tab) => (
              <button 
                key={tab}
                className={`pb-3 border-b-2 whitespace-nowrap transition-all capitalize ${activeTab === tab ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'}`} 
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-lg border border-indigo-100 dark:border-indigo-900 flex items-start gap-4">
                    <Info className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Design Specification Overview</h4>
                      <p className="text-sm text-indigo-700/70 dark:text-indigo-400 leading-relaxed mt-1">
                        This document serves as the master blueprint. All manufacturing line recipes, component constraints, and automated EOL test thresholds are derived from this configuration. 
                        Changes to an Active blueprint require a version increment to maintain traceability.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base Metadata</h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">SKU Reference Code</label>
                          <Input defaultValue={sku.skuCode} disabled={isViewOnly} className="font-mono bg-slate-50/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Model Label</label>
                          <Input defaultValue={sku.skuName} disabled={isViewOnly} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Technical DNA</h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Chemistry Profile</label>
                          <select className="w-full h-10 p-2 border rounded bg-background" defaultValue={sku.chemistry} disabled={isViewOnly}>
                            <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                            <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
                            <option value="LTO">LTO (Lithium Titanate)</option>
                            <option value="Na-Ion">Na-Ion (Sodium Ion)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">BMS Logic Family</label>
                          <Input defaultValue={sku.bmsType} disabled={isViewOnly} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'electrical' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="space-y-1.5">
                    <label className="text-sm font-medium">Series Arrangement (S)</label>
                    <Input type="number" defaultValue={sku.seriesCount} disabled={isViewOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Parallel Arrangement (P)</label>
                    <Input type="number" defaultValue={sku.parallelCount} disabled={isViewOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Target Voltage (V)</label>
                    <Input type="number" defaultValue={sku.nominalVoltage} disabled={isViewOnly} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nominal Capacity (Ah)</label>
                    <Input type="number" defaultValue={sku.capacityAh} disabled={isViewOnly} />
                  </div>
                </div>
              )}

              {activeTab === 'physical' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Module Topology</label>
                      <Input defaultValue={sku.moduleStructure} disabled={isViewOnly} placeholder="e.g. 1x16 Grid" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Pack Architecture</label>
                      <Input defaultValue={sku.packStructure} disabled={isViewOnly} placeholder="e.g. Rigid Alu Enclosure" />
                    </div>
                  </div>
                  <div className="p-12 border-2 border-dashed rounded-xl text-center bg-slate-50/50 dark:bg-slate-900/50">
                    <Layers className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                    <h5 className="font-bold text-slate-600 dark:text-slate-400">Topology Visualization Engine</h5>
                    <p className="text-xs text-muted-foreground mt-1">3D Mesh preview and wiring diagrams for {sku.skuCode} will be available in v1.9</p>
                  </div>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Cell Population Limits</h4>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-slate-50/30">
                        <div className="space-y-1 flex-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Min Count</label>
                          <Input type="number" defaultValue={sku.rules.minCells} disabled={isViewOnly} className="w-32 bg-white dark:bg-slate-950" />
                        </div>
                        <ChevronRight className="hidden sm:block h-4 w-4 text-slate-300 mt-5" />
                        <div className="space-y-1 flex-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Max Count</label>
                          <Input type="number" defaultValue={sku.rules.maxCells} disabled={isViewOnly} className="w-32 bg-white dark:bg-slate-950" />
                        </div>
                        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded border border-dashed text-xs text-center sm:mt-5">
                          Total cells must equal <span className="font-bold">{sku.seriesCount * sku.parallelCount}</span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Hard Gating Constraints</h4>
                    <p className="text-xs text-muted-foreground">The assembly line station will force these scans before completion.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['CELL_SERIAL', 'CELL_VOLTAGE', 'BARCODE_LOT', 'BUSBAR_WELD_CHECK', 'HOUSING_SEAL_TEST'].map(r => (
                        <div key={r} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={sku.rules.requiredScans.includes(r)} 
                            disabled={isViewOnly}
                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-sm font-medium">{r.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="ml-auto text-[10px] uppercase font-bold text-slate-400">Station Gate</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableHead>Revision</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <tbody>
                      {versions.map(v => (
                        <TableRow key={v.id} className={v.id === sku.id ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}>
                          <TableCell className="font-bold">v{v.version}</TableCell>
                          <TableCell><Badge variant={v.status === 'ACTIVE' ? 'success' : 'secondary'}>{v.status}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/sku/${v.id}`)} disabled={v.id === sku.id}>
                              {v.id === sku.id ? 'Active Focus' : 'Switch Context'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-400">Blueprint IQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/20 rounded">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-100">Quality Enforced</p>
                  <p className="text-slate-400 mt-1">Requires {sku.seriesCount} component scans to pass Assembly gate.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded">
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-100">Handshake Profile</p>
                  <p className="text-slate-400 mt-1">Automatic provisioning logic loaded for {sku.bmsType}.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                 <p className="text-[10px] text-slate-500 font-mono italic">Last Revision: {new Date(sku.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
             <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-bold">Calculation Summary</CardTitle></CardHeader>
             <CardContent className="space-y-3 pt-4">
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Nominal Power</span>
                  <span className="font-mono font-bold">{sku.nominalVoltage} VDC</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Capacity (Gross)</span>
                  <span className="font-mono font-bold">{(sku.nominalVoltage * sku.capacityAh / 1000).toFixed(2)} kWh</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted-foreground">Cell Balancing Delta</span>
                  <span className="font-mono font-bold">0.05V Max</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-[10px] text-muted-foreground border-t mt-4 italic">
                  Energy derived from V * Ah config.
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
