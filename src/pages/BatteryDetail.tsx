import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { batteryService } from '../services/api';
import { Battery, BatteryStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, CheckCircle, Truck, Cpu, ClipboardCheck, Lock } from 'lucide-react';
import { workflowGuardrails, STATUS_LABELS } from '../services/workflowGuardrails';
import { GatedAction } from '../components/WorkflowGuards';

const InfoRow = ({ label, value, isLink = false, linkTo = '' }: { label: string, value: any, isLink?: boolean, linkTo?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    {isLink ? (
      <Link to={linkTo} className="font-medium text-sm truncate text-primary hover:underline" title={String(value)}>
        {value || '-'}
      </Link>
    ) : (
      <span className="font-medium text-sm truncate" title={String(value)}>{value || '-'}</span>
    )}
  </div>
);

export default function BatteryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, currentRole, addNotification } = useAppStore();
  
  const [battery, setBattery] = useState<Battery | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadBattery(id);
  }, [id]);

  const loadBattery = async (battId: string) => {
    setLoading(true);
    const data = await batteryService.getBatteryById(battId);
    if (!data) {
      addNotification({ title: "Error", message: "Battery not found", type: "error" });
      navigate('/batteries');
    } else {
      setBattery(data);
    }
    setLoading(false);
  };

  const clusterId = currentCluster?.id || '';
  const guard = battery ? workflowGuardrails.getBatteryGuardrail(battery, clusterId) : null;

  const handleAction = async (action: string) => {
      if (!battery) return;
      const user = `${currentRole?.name} (${clusterId})`;
      setActionLoading(true);

      try {
          if (action === 'provision') {
              await batteryService.provisionBattery(battery.id, { bmsUid: `BMS-${Date.now()}`, firmware: 'v2.2.0', profile: 'STD' });
              addNotification({ title: "Success", message: "BMS Provisioned", type: "success" });
          } 
          else if (action === 'approve') {
              await batteryService.approveBattery(battery.id, user);
              addNotification({ title: "Certified", message: "Asset moved to inventory.", type: "success" });
          } 
          else if (action === 'dispatch') {
               await batteryService.dispatchBattery(battery.id, "Customer Site");
               addNotification({ title: "Dispatched", message: "Logistics record updated.", type: "success" });
          }
          await loadBattery(battery.id);
      } catch (e: any) {
          addNotification({ title: "Error", message: e.message || "Action failed", type: "error" });
      } finally {
          setActionLoading(false);
      }
  };

  const getStatusLabel = (status: BatteryStatus) => {
    if (status === BatteryStatus.DEPLOYED) return STATUS_LABELS.COMPLETED;
    if (status === BatteryStatus.SCRAPPED || status === BatteryStatus.RMA) return STATUS_LABELS.FAILED;
    return STATUS_LABELS.IN_PROGRESS;
  };

  if (loading || !battery) return <div className="p-10 text-center animate-pulse">Syncing traceable records...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/batteries')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-mono">{battery.serialNumber}</h2>
                <Badge variant={battery.status === BatteryStatus.DEPLOYED ? 'success' : 'outline'}>
                    {getStatusLabel(battery.status)}
                </Badge>
            </div>
            <p className="text-muted-foreground text-sm">Asset ID: {battery.id} • {battery.status}</p>
          </div>
        </div>

        <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground">
            <button className={`pb-2 border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent'}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`pb-2 border-b-2 ${activeTab === 'qa' ? 'border-primary text-primary' : 'border-transparent'}`} onClick={() => setActiveTab('qa')}>QA Data</button>
        </div>

        <div className="pt-2">
            {activeTab === 'overview' && (
                <Card>
                    <CardHeader><CardTitle className="text-lg">Asset Identity</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-4">
                        <InfoRow label="Serial Number" value={battery.serialNumber} />
                        <InfoRow label="Current Status" value={battery.status} />
                        <InfoRow label="Batch ID" value={battery.batchId} isLink linkTo={`/batches/${battery.batchId}`} />
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-4 shrink-0">
         <Card>
             <CardHeader className="pb-3"><CardTitle className="text-base">Operations</CardTitle></CardHeader>
             <CardContent className="space-y-2">
                 {guard && (
                   <>
                    <GatedAction guard={guard.provision} onClick={() => handleAction('provision')} label="Provision BMS" icon={Cpu} className="w-full justify-start" variant="outline" />
                    <GatedAction guard={guard.eolUpload} onClick={() => navigate('/eol')} label="Upload QA Data" icon={ClipboardCheck} className="w-full justify-start" variant="outline" />
                    <GatedAction guard={guard.approveStock} onClick={() => handleAction('approve')} label="Approve for Stock" icon={CheckCircle} className="w-full justify-start" variant="outline" />
                    <GatedAction guard={guard.dispatch} onClick={() => handleAction('dispatch')} label="Dispatch Shipment" icon={Truck} className="w-full justify-start" variant="outline" />
                   </>
                 )}
             </CardContent>
         </Card>
      </div>
    </div>
  );
}