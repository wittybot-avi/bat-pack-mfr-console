import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Save, ShieldCheck, Zap, Info, Layers, History, CheckCircle, AlertCircle, ChevronRight, Box } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails, STATUS_LABELS } from '../services/workflowGuardrails';
import { GatedAction, NextStepPrompt } from '../components/WorkflowGuards';

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

  const clusterId = currentCluster?.id || '';
  const isViewOnly = !['C2', 'CS', 'C4'].includes(clusterId);
  
  // Guardrails
  const guard = workflowGuardrails.getSkuGuardrail(sku, clusterId);
  const nextStep = workflowGuardrails.getNextRecommendedStep(sku, 'SKU');

  const handleActivate = async () => {
    try {
      const updated = await skuService.updateSku(sku.id, { status: 'ACTIVE' });
      setSku(updated);
      addNotification({ title: 'Blueprint Activated', message: `${sku.skuCode} is now ACTIVE.`, type: 'success' });
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
            <Badge variant={sku.status === 'ACTIVE' ? 'success' : 'secondary'} className="px-3">
                {sku.status === 'ACTIVE' ? STATUS_LABELS.ACTIVE : STATUS_LABELS.DRAFT}
            </Badge>
            <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-900 border-indigo-200 dark:border-indigo-800">Version {sku.version}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{sku.skuName}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <GatedAction 
            guard={guard.activate} 
            onClick={handleActivate} 
            label="Activate Spec" 
            icon={CheckCircle} 
            variant="outline"
            className="flex-1 md:flex-none border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          />
          {!isViewOnly && (
            <Button className="flex-1 md:flex-none shadow-indigo-200 dark:shadow-none">
              <Save className="mr-2 h-4 w-4" /> Update Blueprint
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <NextStepPrompt step={nextStep} />

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
                  </div>
                </div>
              )}
              {/* Other tabs follow same logic... */}
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
            </CardContent>
          </Card>

          <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Production Controls</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                 <GatedAction 
                   guard={guard.createBatch} 
                   onClick={() => navigate('/batches')} 
                   label="Create Mfg Batch" 
                   icon={Box} 
                   className="w-full justify-start"
                   variant="outline"
                 />
              </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}