import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { batteryService } from '../services/api';
import { Battery, BatteryStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/design-system';
import { ArrowLeft, CheckCircle, Truck, Cpu, ClipboardCheck, History, Fingerprint, Zap } from 'lucide-react';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

const InfoRow = ({ label, value, isLink = false, linkTo = '' }: { label: string, value: any, isLink?: boolean, linkTo?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</span>
    {isLink ? (
      <Link to={linkTo} className="font-bold text-sm truncate text-primary hover:underline" title={String(value)}>
        {value || '-'}
      </Link>
    ) : (
      <span className="font-bold text-sm truncate text-slate-700 dark:text-slate-200" title={String(value)}>{value || '-'}</span>
    )}
  </div>
);

export default function BatteryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  
  const [battery, setBattery] = useState<Battery | null>(null);
  const [loading, setLoading] = useState(true);

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadBattery(id);
  }, [id]);

  const loadBattery = async (battId: string) => {
    setLoading(true);
    const data = await batteryService.getBatteryById(battId);
    if (!data) {
        addNotification({ title: 'Redirection', message: 'Asset identity not found.', type: 'info' });
        navigate('/batteries');
        return;
    }
    setBattery(data);
    setLoading(false);
  };

  if (loading || !battery) return <div className="p-10 text-center animate-pulse">Syncing traceable record...</div>;

  const guards = workflowGuardrails.getBatteryGuardrail(battery, clusterId);

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S8"
        title="Asset Digital Twin"
        objective="Verify individual asset health metrics, provisioning status, and genealogy integrity."
        entityLabel={battery.serialNumber}
        status={battery.status}
        diagnostics={{ route: '/batteries', entityId: battery.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/batteries')} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Global Trace
            </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <NextStepsPanel entity={battery} type="BATTERY" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30"><CardTitle className="text-lg flex items-center gap-2"><Fingerprint size={18} className="text-primary"/> Core Identity</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-6 pt-6">
                        <InfoRow label="Serial Number" value={battery.serialNumber} />
                        <InfoRow label="Internal ID" value={battery.id} />
                        <InfoRow label="Last Reported" value={battery.location} />
                        <InfoRow label="Lot Link" value={battery.batchId} isLink linkTo={`/batches/${battery.batchId}`} />
                    </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/30"><CardTitle className="text-lg flex items-center gap-2"><Zap size={18} className="text-primary"/> Vital Statistics</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-6 pt-6">
                        <InfoRow label="State of Health" value={`${battery.soh?.toFixed(1)}%`} />
                        <InfoRow label="Nominal Voltage" value={`${battery.voltage?.toFixed(1)}V`} />
                        <InfoRow label="Nominal Capacity" value={`${battery.capacityAh}Ah`} />
                        <InfoRow label="EOL Decision" value={battery.eolResult || 'PENDING'} />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="border-b"><CardTitle className="text-base flex items-center gap-2"><History size={18} className="text-primary"/> Chain of Custody Summary</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <div className="p-8 text-center text-slate-400 text-xs italic font-mono">
                        Genealogy mapping and custody events are available in the full Lineage Explorer.
                    </div>
                </CardContent>
            </Card>
          </div>

          <div className="w-full lg:w-80 space-y-4 shrink-0">
             <Card className="bg-slate-900 text-white border-none shadow-xl">
                 <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Asset Operations</CardTitle></CardHeader>
                 <CardContent className="space-y-3 pt-6">
                    <ActionGuard 
                        guard={guards.provision} 
                        onClick={() => navigate('/provisioning')} 
                        label="Provision BMS Controller" 
                        icon={Cpu} 
                        className="w-full justify-start h-12 bg-indigo-600 hover:bg-indigo-700 border-none"
                        actionName="Provision_Battery_BMS"
                        entityId={battery.id}
                    />
                    <ActionGuard 
                        guard={guards.test} 
                        onClick={() => navigate(`/assure/eol/${battery.id}`)} 
                        label="Execute QA Testing" 
                        icon={ClipboardCheck} 
                        variant="outline"
                        className="w-full justify-start h-12 text-white border-slate-700 hover:bg-slate-800"
                        actionName="Battery_Detail_Test_Navigate"
                        entityId={battery.id}
                    />
                    <Button variant="outline" className="w-full justify-start h-12 text-white border-slate-700 hover:bg-slate-800 opacity-40 cursor-not-allowed" disabled>
                        <CheckCircle className="mr-2 h-4 w-4" /> Release to Inventory
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 text-white border-slate-700 hover:bg-slate-800 opacity-40 cursor-not-allowed" disabled>
                        <Truck className="mr-2 h-4 w-4" /> Dispatch Unit
                    </Button>
                    <div className="bg-slate-800/50 p-3 rounded text-[10px] text-slate-400 font-bold uppercase tracking-tighter text-center pt-2 italic">
                        Use workflow-specific consoles for bulk actions.
                    </div>
                 </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
