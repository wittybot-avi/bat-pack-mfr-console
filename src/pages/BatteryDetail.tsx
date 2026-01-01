import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { batteryService } from '../services/api';
import { Battery, BatteryStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui/design-system';
import { ArrowLeft, CheckCircle, Truck, Cpu, ClipboardCheck } from 'lucide-react';
import { STATUS_MAP } from '../services/workflowGuardrails';

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
  const { addNotification } = useAppStore();
  
  const [battery, setBattery] = useState<Battery | null>(null);
  const [loading, setLoading] = useState(true);

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

  const statusConfig = STATUS_MAP[battery.status] || STATUS_MAP.DRAFT;

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
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">Asset Registry: {battery.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <Card>
                <CardHeader><CardTitle className="text-lg">Core Identity</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-y-4">
                    <InfoRow label="Serial Number" value={battery.serialNumber} />
                    <InfoRow label="System Status" value={battery.status} />
                    <InfoRow label="Last Reported" value={battery.location} />
                    <InfoRow label="Lot Link" value={battery.batchId} isLink linkTo={`/batches/${battery.batchId}`} />
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="w-full lg:w-72 space-y-4 shrink-0">
         <Card>
             <CardHeader className="pb-3"><CardTitle className="text-base">Operations</CardTitle></CardHeader>
             <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                    <Cpu className="mr-2 h-4 w-4" /> Provision BMS
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                    <ClipboardCheck className="mr-2 h-4 w-4" /> Run QA Test
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                    <CheckCircle className="mr-2 h-4 w-4" /> Release to Stock
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                    <Truck className="mr-2 h-4 w-4" /> Dispatch Unit
                </Button>
                <p className="text-[10px] text-center text-muted-foreground pt-2 italic">Use workflow-specific consoles for actions.</p>
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
