import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '../components/ui/design-system';
import { ArrowLeft, Save, ShieldCheck, Info, CheckCircle, AlertCircle, Box } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { workflowGuardrails, STATUS_MAP } from '../services/workflowGuardrails';
import { GatedAction, NextStepPanel } from '../components/WorkflowGuards';

export default function SkuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(true);

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadSku(id);
  }, [id]);

  const loadSku = async (skuId: string) => {
    setLoading(true);
    const data = await skuService.getSku(skuId);
    if (!data) {
        addNotification({ title: 'Redirection', message: 'Asset not found in registry.', type: 'info' });
        navigate('/sku');
        return;
    }
    setSku(data);
    setLoading(false);
  };

  if (loading || !sku) return <div className="p-20 text-center animate-pulse">Syncing blueprint...</div>;

  const guards = workflowGuardrails.getSkuGuardrail(sku, clusterId);
  const nextStep = workflowGuardrails.getNextRecommendedStep(sku, 'SKU');
  const statusConfig = STATUS_MAP[sku.status] || STATUS_MAP.DRAFT;

  const handleActivate = async () => {
    try {
      const updated = await skuService.updateSku(sku.id, { status: 'ACTIVE' });
      setSku(updated);
      addNotification({ title: 'Activated', message: `${sku.skuCode} is now ready for production.`, type: 'success' });
    } catch (e) {
      addNotification({ title: 'Error', message: 'Activation failed.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sku')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{sku.skuCode}</h2>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{sku.skuName}</p>
        </div>
        <div className="flex gap-2">
          <GatedAction 
            guard={guards.activate} 
            onClick={handleActivate} 
            label="Activate Blueprint" 
            icon={CheckCircle} 
            variant="outline"
            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          />
          <GatedAction 
            guard={guards.createBatch} 
            onClick={() => navigate('/batches')} 
            label="Start Mfg Batch" 
            icon={Box} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <NextStepPanel step={nextStep} />
          
          <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" /> Specifications
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              <div><p className="text-xs text-muted-foreground uppercase">Chemistry</p><p className="font-medium">{sku.chemistry}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Topology</p><p className="font-medium">{sku.seriesCount}S {sku.parallelCount}P</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Voltage</p><p className="font-medium">{sku.nominalVoltage}V</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Capacity</p><p className="font-medium">{sku.capacityAh}Ah</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none">
                <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Rule Engine</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active blueprint lock prevents unauthorized tampering during batch generation.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
