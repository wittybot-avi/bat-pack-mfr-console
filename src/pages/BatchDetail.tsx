
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchService } from '../services/api';
import { Batch, BatchStatus, BatchNote, SupplierLot, UserRole } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, Save, AlertTriangle, FileText, CheckCircle, XCircle, Lock, Download, PauseCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';

// --- Components for Sections ---

// Fix: Add optional key prop to handle React list rendering in TS
const NoteItem = ({ note }: { note: BatchNote, key?: any }) => (
  <div className="border-b last:border-0 pb-3 mb-3">
    <div className="flex justify-between items-start mb-1">
      <span className="font-semibold text-sm">{note.author} <span className="text-xs font-normal text-muted-foreground">({note.role})</span></span>
      <span className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</span>
    </div>
    <div className="text-sm">
      {note.type !== 'General' && <Badge variant="outline" className="mr-2 text-[10px]">{note.type}</Badge>}
      {note.text}
    </div>
  </div>
);

const WorkflowModal = ({ isOpen, title, onClose, onConfirm, loading }: any) => {
  const [reason, setReason] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[400px] shadow-xl border dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <textarea 
          className="w-full min-h-[100px] p-2 border rounded-md bg-transparent text-sm mb-4"
          placeholder="Enter reason or comments..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!reason || loading} onClick={() => onConfirm(reason)}>{loading ? 'Processing...' : 'Confirm'}</Button>
        </div>
      </div>
    </div>
  );
};

// --- Main Detail Page ---

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, currentRole, addNotification } = useAppStore();
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  
  // Workflow State
  const [modalState, setModalState] = useState<{ type: 'hold' | 'release' | 'close' | null, action: 'request' | 'approve' | null }>({ type: null, action: null });
  const [isProcessing, setIsProcessing] = useState(false);

  // RBAC Definitions
  const isSuperUser = currentCluster?.id === 'CS';
  const isC2 = currentCluster?.id === 'C2'; // Mfg
  const isC3 = currentCluster?.id === 'C3'; // QA
  const isC6 = currentCluster?.id === 'C6'; // Logistics
  const isC9 = currentCluster?.id === 'C9'; // External

  const canEditHeader = isSuperUser || isC2;
  const canEditSuppliers = isSuperUser || isC6;
  const canEditQA = isSuperUser || isC3;
  
  // Workflow Permissions
  const canRequestHold = isSuperUser || isC2 || isC6;
  const canApproveHold = isSuperUser || isC3 || (currentCluster?.id === 'C7') || (currentCluster?.id === 'C8');
  
  const canRequestClose = isSuperUser || isC2;
  const canApproveClose = isSuperUser || isC3;

  useEffect(() => {
    if (id) loadBatch(id);
  }, [id]);

  const loadBatch = async (batchId: string) => {
    setLoading(true);
    const data = await batchService.getBatchById(batchId);
    if (!data) {
      addNotification({ title: "Error", message: "Batch not found", type: "error" });
      navigate('/batches');
    } else {
      setBatch(data);
    }
    setLoading(false);
  };

  const handleWorkflowAction = async (reason: string) => {
    if (!batch || !modalState.type) return;
    setIsProcessing(true);
    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    try {
      if (modalState.type === 'hold') {
        if (modalState.action === 'request') await batchService.requestHold(batch.id, reason, userLabel);
        else await batchService.approveHold(batch.id, reason, userLabel);
      } else if (modalState.type === 'release') {
        if (modalState.action === 'request') await batchService.requestRelease(batch.id, reason, userLabel);
        else await batchService.approveRelease(batch.id, reason, userLabel);
      }
      addNotification({ title: "Success", message: "Workflow action updated", type: "success" });
      await loadBatch(batch.id);
    } catch (e) {
      addNotification({ title: "Error", message: "Action failed", type: "error" });
    } finally {
      setIsProcessing(false);
      setModalState({ type: null, action: null });
    }
  };

  const handleCloseBatch = async () => {
    if (!batch) return;
    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;
    try {
        if (isSuperUser) {
            await batchService.forceClose(batch.id, userLabel);
        } else if (isC3) {
            await batchService.approveCloseByQA(batch.id, userLabel);
        } else if (isC2) {
            await batchService.requestCloseByProd(batch.id, userLabel);
        }
        addNotification({ title: "Success", message: "Close workflow updated", type: "success" });
        await loadBatch(batch.id);
    } catch (e) {
        addNotification({ title: "Error", message: "Failed to update close status", type: "error" });
    }
  };

  if (loading || !batch) return <div className="p-10 text-center">Loading batch details...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/batches')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{batch.batchNumber}</h2>
                <Badge variant={batch.status === BatchStatus.CLOSED ? 'success' : 'default'}>{batch.status}</Badge>
                {batch.holdRequestPending && <Badge variant="warning">Hold Requested</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">
                {batch.packModelId} • {batch.sku} • {batch.chemistry}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
            <button className={`pb-2 border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('overview')}>Overview</button>
            {!isC9 && <button className={`pb-2 border-b-2 ${activeTab === 'product' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('product')}>Product & BOM</button>}
            {!isC9 && <button className={`pb-2 border-b-2 ${activeTab === 'suppliers' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('suppliers')}>Supplier Lots</button>}
            {!isC9 && <button className={`pb-2 border-b-2 ${activeTab === 'production' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('production')}>Production</button>}
            <button className={`pb-2 border-b-2 ${activeTab === 'qa' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('qa')}>QA / EOL</button>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Key Metrics</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-muted-foreground">Target Qty</p><p className="text-xl font-bold">{batch.targetQuantity}</p></div>
                            <div><p className="text-xs text-muted-foreground">Built Qty</p><p className="text-xl font-bold">{batch.qtyBuilt}</p></div>
                            <div><p className="text-xs text-muted-foreground">EOL Pass Rate</p><p className={`text-xl font-bold ${batch.eolPassRatePct > 95 ? 'text-emerald-600' : 'text-amber-500'}`}>{batch.eolPassRatePct}%</p></div>
                            <div><p className="text-xs text-muted-foreground">Yield</p><p className="text-xl font-bold">{batch.yieldPct}%</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Recent Notes</CardTitle></CardHeader>
                        <CardContent className="max-h-[200px] overflow-y-auto">
                            {batch.notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes yet.</p> : batch.notes.slice().reverse().map(note => <NoteItem key={note.id} note={note} />)}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'product' && !isC9 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Product Specification</CardTitle>
                        {canEditHeader && !editMode && <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Edit</Button>}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-medium text-muted-foreground">Pack Model</label><Input disabled={!editMode} defaultValue={batch.packModelId} /></div>
                            <div><label className="text-xs font-medium text-muted-foreground">Variant</label><Input disabled={!editMode} defaultValue={batch.packVariant} /></div>
                            <div><label className="text-xs font-medium text-muted-foreground">Chemistry</label><Input disabled={!editMode} defaultValue={batch.chemistry} /></div>
                            <div><label className="text-xs font-medium text-muted-foreground">Config</label><Input disabled={!editMode} defaultValue={`${batch.seriesCount}S ${batch.parallelCount}P`} /></div>
                            <div><label className="text-xs font-medium text-muted-foreground">BOM Version</label><Input disabled={!editMode} defaultValue={batch.bomVersion} /></div>
                            <div><label className="text-xs font-medium text-muted-foreground">Cell Spec</label><Input disabled={!editMode} defaultValue={batch.cellSpec} /></div>
                        </div>
                        {editMode && <div className="flex justify-end"><Button size="sm" onClick={() => setEditMode(false)}>Save Changes</Button></div>}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'suppliers' && !isC9 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Supplier Lots Traceability</CardTitle>
                        {canEditSuppliers && <Button size="sm">Add Lot</Button>}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Supplier</TableHead><TableHead>Lot ID</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                            <tbody>
                                {batch.supplierLots.map(lot => (
                                    <TableRow key={lot.id}>
                                        <TableCell>{lot.lotType}</TableCell>
                                        <TableCell>{lot.supplierName}</TableCell>
                                        <TableCell className="font-mono text-xs">{lot.supplierLotId}</TableCell>
                                        <TableCell>{lot.receivedDate}</TableCell>
                                    </TableRow>
                                ))}
                            </tbody>
                        </Table>
                    </CardContent>
                </Card>
            )}

             {activeTab === 'production' && !isC9 && (
                 <Card>
                    <CardHeader><CardTitle className="text-lg">Process Data</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-muted-foreground">Line ID</label><div className="font-medium">{batch.lineId}</div></div>
                        <div><label className="text-xs text-muted-foreground">Shift</label><div className="font-medium">{batch.shiftId}</div></div>
                        <div><label className="text-xs text-muted-foreground">Supervisor</label><div className="font-medium">{batch.supervisorId}</div></div>
                        <div><label className="text-xs text-muted-foreground">Started</label><div className="font-medium">{new Date(batch.startPlannedAt).toLocaleDateString()}</div></div>
                    </CardContent>
                 </Card>
             )}

             {activeTab === 'qa' && (
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Quality Assurance</CardTitle>
                        {canEditQA && <Button size="sm">Update Metrics</Button>}
                     </CardHeader>
                     <CardContent>
                         <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded text-center">
                                <div className="text-2xl font-bold text-emerald-600">{batch.qtyPassedEOL}</div>
                                <div className="text-xs text-muted-foreground">Passed EOL</div>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded text-center">
                                <div className="text-2xl font-bold text-rose-600">{batch.qtyFailedEOL}</div>
                                <div className="text-xs text-muted-foreground">Failed</div>
                            </div>
                             <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded text-center">
                                <div className="text-2xl font-bold text-amber-600">{batch.qtyReworked}</div>
                                <div className="text-xs text-muted-foreground">Reworked</div>
                            </div>
                         </div>
                         <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Download QA Certificate (Stub)</Button>
                     </CardContent>
                 </Card>
             )}
        </div>
      </div>

      {/* Right Action Panel */}
      <div className="w-full lg:w-80 space-y-4 shrink-0">
         <Card>
             <CardHeader className="pb-2"><CardTitle className="text-base">Batch Actions</CardTitle></CardHeader>
             <CardContent className="space-y-3">
                 {/* Hold / Release Actions */}
                 {batch.status === BatchStatus.ON_HOLD ? (
                     <>
                        <div className="bg-rose-50 p-3 rounded text-xs text-rose-800 border border-rose-200 flex items-start gap-2">
                             <AlertTriangle className="h-4 w-4 shrink-0" />
                             <div>
                                 <strong>Batch on Hold</strong>
                                 <p className="mt-1">Requires approval to release.</p>
                             </div>
                        </div>
                        {canApproveHold ? (
                            <Button className="w-full" onClick={() => setModalState({ type: 'release', action: 'approve' })}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Approve Release
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full" onClick={() => setModalState({ type: 'release', action: 'request' })}>
                                Request Release
                            </Button>
                        )}
                     </>
                 ) : (
                     <>
                        {canApproveHold ? (
                             <Button variant="destructive" className="w-full" onClick={() => setModalState({ type: 'hold', action: 'approve' })}>
                                 <PauseCircle className="mr-2 h-4 w-4" /> Place on Hold
                             </Button>
                        ) : canRequestHold ? (
                             <Button variant="outline" className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setModalState({ type: 'hold', action: 'request' })}>
                                 <AlertTriangle className="mr-2 h-4 w-4" /> Request Hold
                             </Button>
                        ) : null}
                     </>
                 )}

                 {/* Close Batch Logic */}
                 {batch.status !== BatchStatus.CLOSED && (
                     <div className="pt-4 border-t space-y-2">
                         <div className="flex justify-between text-sm">
                             <span>Prod. Request:</span>
                             {batch.closeRequestByProd ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <span className="text-muted-foreground text-xs">-</span>}
                         </div>
                         <div className="flex justify-between text-sm">
                             <span>QA Approval:</span>
                             {batch.closeApprovedByQA ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <span className="text-muted-foreground text-xs">-</span>}
                         </div>
                         {(canRequestClose || canApproveClose) && (
                            <Button variant="outline" className="w-full mt-2" onClick={handleCloseBatch}>
                                <Lock className="mr-2 h-4 w-4" /> 
                                {isSuperUser ? 'Force Close' : isC3 ? 'QA Approve Close' : 'Request Close'}
                            </Button>
                         )}
                     </div>
                 )}
                 
                 {isC9 && <div className="text-xs text-center text-muted-foreground pt-2">External View: Read Only</div>}
             </CardContent>
         </Card>
      </div>
      
      <WorkflowModal 
        isOpen={!!modalState.type} 
        title={`${modalState.action === 'request' ? 'Request' : 'Approve'} ${modalState.type === 'hold' ? 'Hold' : 'Release'}`}
        onClose={() => setModalState({ type: null, action: null })}
        onConfirm={handleWorkflowAction}
        loading={isProcessing}
      />
    </div>
  );
}
