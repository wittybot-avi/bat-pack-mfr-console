
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { batteryService } from '../services/api';
import { Battery, BatteryStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, AlertTriangle, CheckCircle, Download, Truck, Cpu, ClipboardCheck, Lock, Link2 } from 'lucide-react';

// Helpers
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

const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = "outline", 
  disabled = false, 
  roleRequired 
}: any) => {
  const content = (
    <Button variant={variant} className="w-full justify-start gap-2" onClick={onClick} disabled={disabled}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {disabled && <Lock className="ml-auto h-3 w-3 opacity-50" />}
    </Button>
  );

  if (disabled) {
    return <Tooltip content={`Requires role: ${roleRequired}`}>{content}</Tooltip>;
  }
  return content;
};

export default function BatteryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, currentRole, addNotification } = useAppStore();
  
  const [battery, setBattery] = useState<Battery | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // RBAC Checks
  const isSuperUser = currentCluster?.id === 'CS';
  const isC1 = currentCluster?.id === 'C1'; // Exec
  const isC2 = currentCluster?.id === 'C2'; // Mfg
  const isC3 = currentCluster?.id === 'C3'; // QA
  const isC5 = currentCluster?.id === 'C5'; // BMS
  const isC6 = currentCluster?.id === 'C6'; // Logistics
  const isC7 = currentCluster?.id === 'C7'; // Warranty
  const isC8 = currentCluster?.id === 'C8'; // Compliance
  const isC9 = currentCluster?.id === 'C9'; // External

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

  const handleAction = async (action: string) => {
      if (!battery) return;
      
      const user = `${currentRole?.name} (${currentCluster?.id})`;
      setActionLoading(true);

      try {
          if (action === 'rework') {
              const note = window.prompt("Enter rework reason:");
              if (!note) return;
              await batteryService.flagRework(battery.id, note, user);
              addNotification({ title: "Updated", message: "Flagged for rework", type: "warning" });
          } 
          else if (action === 'provision') {
              if (!window.confirm("Start provisioning sequence?")) return;
              await batteryService.provisionBattery(battery.id, { bmsUid: `BMS-${Date.now()}`, firmware: 'v2.2.0', profile: 'STD' });
              addNotification({ title: "Success", message: "BMS Provisioned & Bound", type: "success" });
          } 
          else if (action === 'uploadEOL') {
               await batteryService.uploadEOLResult(battery.id, { soh: 99, capacity: 105, resistance: 22, result: 'PASS' });
               addNotification({ title: "Success", message: "EOL Results Uploaded", type: "success" });
          } 
          else if (action === 'approve') {
              await batteryService.approveBattery(battery.id, user);
              addNotification({ title: "Approved", message: "Battery certified and moved to inventory", type: "success" });
          } 
          else if (action === 'dispatch') {
               const loc = window.prompt("Enter destination:");
               if (!loc) return;
               await batteryService.dispatchBattery(battery.id, loc);
               addNotification({ title: "Dispatched", message: "Movement order created", type: "success" });
          }
          else if (action === 'cert') {
              addNotification({ title: "Downloading", message: "Generating digital certificate...", type: "info" });
          }
          
          await loadBattery(battery.id);
      } catch (e: any) {
          addNotification({ title: "Error", message: e.message || "Action failed", type: "error" });
      } finally {
          setActionLoading(false);
      }
  };

  if (loading || !battery) return <div className="p-10 text-center">Loading battery details...</div>;

  // Tab Visibility Logic
  const showAssembly = isSuperUser || isC2 || isC3 || isC5;
  const showProvisioning = isSuperUser || isC2 || isC5 || isC3;
  const showQA = isSuperUser || isC1 || isC2 || isC3 || isC5 || isC7 || isC8 || isC9;
  const showLogistics = isSuperUser || isC6 || isC1 || isC2;
  const showAudit = !isC9; 

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/batteries')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-mono">{battery.serialNumber}</h2>
                <Badge variant={battery.status === BatteryStatus.DEPLOYED ? 'success' : 'outline'}>{battery.status}</Badge>
                {battery.reworkFlag && <Badge variant="warning">Rework</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">
                Plant: {battery.plantId}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
            <button className={`pb-2 border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('overview')}>Overview</button>
            {showAssembly && <button className={`pb-2 border-b-2 ${activeTab === 'assembly' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('assembly')}>Assembly</button>}
            {showProvisioning && <button className={`pb-2 border-b-2 ${activeTab === 'provisioning' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('provisioning')}>BMS & Firmware</button>}
            {showQA && <button className={`pb-2 border-b-2 ${activeTab === 'qa' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('qa')}>QA / EOL</button>}
            {showLogistics && <button className={`pb-2 border-b-2 ${activeTab === 'logistics' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('logistics')}>Logistics</button>}
            {showAudit && <button className={`pb-2 border-b-2 ${activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('audit')}>Audit Log</button>}
        </div>

        <div className="pt-2">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Identity & Status</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-y-4">
                            <InfoRow label="Serial Number" value={battery.serialNumber} />
                            <InfoRow label="QR Code" value={battery.qrCode} />
                            <InfoRow label="Current Status" value={battery.status} />
                            <InfoRow label="Last Location" value={battery.location} />
                            <InfoRow label="Manufactured At" value={new Date(battery.manufacturedAt || '').toLocaleDateString()} />
                            <InfoRow label="Batch ID" value={battery.batchId} isLink linkTo={`/batches/${battery.batchId}`} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Health Snapshot</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-y-4">
                            <InfoRow label="State of Health" value={battery.soh ? `${battery.soh.toFixed(1)}%` : 'N/A'} />
                            <InfoRow label="State of Charge" value={battery.soc ? `${battery.soc.toFixed(1)}%` : 'N/A'} />
                            <InfoRow label="EOL Result" value={battery.eolResult || 'Pending'} />
                            <InfoRow label="Certificate" value={battery.certificateRef || 'None'} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ASSEMBLY TAB */}
            {activeTab === 'assembly' && showAssembly && (
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-lg">Assembly Trace</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/trace/lineage/${battery.serialNumber}`)}>
                          <Link2 className="h-4 w-4 mr-2" /> Full Lineage Audit
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Station</TableHead><TableHead>Event</TableHead><TableHead>Operator</TableHead></TableRow></TableHeader>
                            <tbody>
                                {battery.assemblyEvents.length === 0 ? <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No events recorded</td></tr> : 
                                battery.assemblyEvents.map(evt => (
                                    <TableRow key={evt.id}>
                                        <TableCell className="text-xs">{new Date(evt.timestamp).toLocaleString()}</TableCell>
                                        <TableCell>{evt.stationId}</TableCell>
                                        <TableCell>{evt.eventType}</TableCell>
                                        <TableCell className="font-mono text-xs">{evt.operatorId}</TableCell>
                                    </TableRow>
                                ))}
                            </tbody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* PROVISIONING TAB */}
            {activeTab === 'provisioning' && showProvisioning && (
                <Card>
                    <CardHeader><CardTitle className="text-lg">BMS & Provisioning</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="BMS Hardware UID" value={battery.bmsUid} />
                            <InfoRow label="Firmware Version" value={battery.firmwareVersion} />
                            <InfoRow label="Calibration Profile" value={battery.calibrationProfile} />
                            <InfoRow label="Crypto Keys" value={battery.cryptoProvisioned ? "Injected" : "Pending"} />
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded border">
                            <div className={`h-3 w-3 rounded-full ${battery.provisioningStatus === 'PASS' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="font-medium">Status: {battery.provisioningStatus}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* QA TAB */}
            {activeTab === 'qa' && showQA && (
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">EOL Test Results</CardTitle>
                        {battery.certificateRef && <Badge variant="success">Certified</Badge>}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 border rounded">
                                <div className="text-xs text-muted-foreground">Capacity</div>
                                <div className="text-xl font-bold">{battery.capacityAh || '-'} Ah</div>
                            </div>
                            <div className="p-3 border rounded">
                                <div className="text-xs text-muted-foreground">DC IR</div>
                                <div className="text-xl font-bold">{battery.internalResistance || '-'} mΩ</div>
                            </div>
                            <div className="p-3 border rounded">
                                <div className="text-xs text-muted-foreground">Thermal</div>
                                <div className="text-xl font-bold">{battery.thermalResult || '-'}</div>
                            </div>
                        </div>
                        {battery.eolResult && (
                            <div className={`p-4 rounded-md text-center ${battery.eolResult === 'PASS' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                                <h3 className="text-lg font-bold">Overall Result: {battery.eolResult}</h3>
                                {battery.qaApproverId && <p className="text-xs mt-1">Approved by {battery.qaApproverId}</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

             {/* LOGISTICS TAB */}
             {activeTab === 'logistics' && showLogistics && (
                 <Card>
                    <CardHeader><CardTitle className="text-lg">Logistics & Custody</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow label="Current Location" value={battery.location} />
                        <InfoRow label="Dispatch Status" value={battery.dispatchStatus} />
                        <InfoRow label="Custody Chain" value={battery.custodyStatus || "Factory Internal"} />
                    </CardContent>
                </Card>
            )}
            
            {/* AUDIT TAB */}
            {activeTab === 'audit' && showAudit && (
                 <Card>
                    <CardHeader><CardTitle className="text-lg">System Notes</CardTitle></CardHeader>
                    <CardContent>
                         {battery.notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes.</p> : 
                            battery.notes.slice().reverse().map(note => (
                                <div key={note.id} className="border-b last:border-0 pb-2 mb-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{note.author} ({note.role})</span>
                                        <span>{new Date(note.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm mt-1">{note.text}</p>
                                </div>
                            ))
                         }
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

      {/* Action Panel */}
      <div className="w-full lg:w-72 space-y-4 shrink-0">
         <Card>
             <CardHeader className="pb-3"><CardTitle className="text-base">Operations</CardTitle></CardHeader>
             <CardContent className="space-y-2">
                 <ActionButton 
                    icon={AlertTriangle} 
                    label="Mark Rework" 
                    onClick={() => handleAction('rework')} 
                    disabled={!(isSuperUser || isC2)} 
                    roleRequired="Production (C2)"
                    variant="ghost"
                 />
                 
                 <ActionButton 
                    icon={Cpu} 
                    label="Provision BMS" 
                    onClick={() => handleAction('provision')} 
                    disabled={!(isSuperUser || isC5 || isC2)}
                    roleRequired="BMS Eng (C5)"
                 />

                 <ActionButton 
                    icon={ClipboardCheck} 
                    label="Upload EOL Data" 
                    onClick={() => handleAction('uploadEOL')} 
                    disabled={!(isSuperUser || isC3)}
                    roleRequired="QA (C3)"
                 />

                 <ActionButton 
                    icon={CheckCircle} 
                    label="Approve for Stock" 
                    onClick={() => handleAction('approve')} 
                    disabled={!(isSuperUser || isC3) || battery.eolResult !== 'PASS'}
                    roleRequired="QA (C3)"
                    variant={battery.eolResult === 'PASS' && battery.status !== 'In Inventory' ? "default" : "outline"}
                 />

                 <ActionButton 
                    icon={Truck} 
                    label="Dispatch" 
                    onClick={() => handleAction('dispatch')} 
                    disabled={!(isSuperUser || isC6) || battery.status !== 'In Inventory'}
                    roleRequired="Logistics (C6)"
                 />
                 
                 <div className="border-t pt-2 mt-2">
                     <ActionButton 
                        icon={Download} 
                        label="Digital Certificate" 
                        onClick={() => handleAction('cert')} 
                        disabled={!battery.certificateRef}
                        roleRequired="Any Viewer"
                        variant="ghost"
                     />
                 </div>
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
