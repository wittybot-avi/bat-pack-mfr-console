import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchService } from '../services/api';
import { Batch, BatchStatus, BatchNote } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '../components/ui/design-system';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Lock, PlayCircle, ClipboardList, Box } from 'lucide-react';
import { workflowGuardrails } from '../services/workflowGuardrails';
import { StageHeader, NextStepsPanel, ActionGuard } from '../components/SopGuidedUX';

const NoteItem = ({ note }: { note: BatchNote, key?: any }) => (
  <div className="border-b last:border-0 pb-3 mb-3">
    <div className="flex justify-between items-start mb-1">
      <span className="font-semibold text-sm">{note.author} <span className="text-xs font-normal text-muted-foreground">({note.role})</span></span>
      <span className="text-xs text-muted-foreground">{new Date(note.timestamp).toLocaleString()}</span>
    </div>
    <div className="text-sm">
      {note.type !== 'General' && <Badge variant="outline" className="mr-2 text-[10px] font-bold">{note.type}</Badge>}
      {note.text}
    </div>
  </div>
);

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  const clusterId = currentCluster?.id || '';

  useEffect(() => {
    if (id) loadBatch(id);
  }, [id]);

  const loadBatch = async (batchId: string) => {
    setLoading(true);
    const data = await batchService.getBatchById(batchId);
    if (!data) {
        addNotification({ title: 'Redirection', message: 'Batch not found. Redirecting to queue.', type: 'info' });
        navigate('/batches');
        return;
    }
    setBatch(data);
    setLoading(false);
  };

  if (loading || !batch) return <div className="p-10 text-center animate-pulse">Syncing batch ledger...</div>;

  const guards = workflowGuardrails.getBatchGuardrail(batch, clusterId);

  const handleRelease = async () => {
    try {
        await batchService.updateBatch(batch.id, { status: BatchStatus.IN_PRODUCTION });
        addNotification({ title: "Released", message: "Batch released to shopfloor.", type: "success" });
        loadBatch(batch.id);
    } catch (e) {
        addNotification({ title: "Error", message: "Action failed", type: "error" });
    }
  };

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="S3"
        title="Manufacturing Authorization"
        objective="Activate production planning for a specific SKU lot and authorize resource allocation."
        entityLabel={batch.batchNumber}
        status={batch.status}
        diagnostics={{ route: '/batches', entityId: batch.id }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/batches')} className="gap-2 text-slate-500">
                <ArrowLeft className="h-4 w-4" /> Back to Production Log
            </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <NextStepsPanel entity={batch} type="BATCH" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2 border-b"><CardTitle className="text-lg flex items-center gap-2"><ClipboardList size={18} className="text-primary"/> Production Plan</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-y-6 pt-6">
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Target Quantity</p><p className="text-2xl font-black text-slate-800 dark:text-slate-100">{batch.targetQuantity}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Yield</p><p className="text-2xl font-black text-emerald-600">{batch.qtyPassedEOL}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">SKU Blueprint</p><p className="text-sm font-bold font-mono text-indigo-600">{batch.sku}</p></div>
                        <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Plant Location</p><p className="text-sm font-bold uppercase">{batch.plantId}</p></div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2 border-b"><CardTitle className="text-lg flex items-center gap-2"><Box size={18} className="text-primary"/> Process Audit</CardTitle></CardHeader>
                    <CardContent className="max-h-[250px] overflow-y-auto pt-4 pr-2">
                        {batch.notes.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-8">No audit events recorded for this lot.</p> : batch.notes.map(note => <NoteItem key={note.id} note={note} />)}
                    </CardContent>
                </Card>
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-4 shrink-0">
             <Card className="bg-slate-900 text-white border-none shadow-xl">
                 <CardHeader className="pb-3 border-b border-slate-800"><CardTitle className="text-sm uppercase tracking-wider text-slate-400">Workstation Control</CardTitle></CardHeader>
                 <CardContent className="space-y-4 pt-6">
                    <ActionGuard 
                        guard={guards.release} 
                        onClick={handleRelease} 
                        label="Release to Shopfloor" 
                        icon={PlayCircle} 
                        className="w-full h-12 bg-primary hover:bg-primary/90 border-none shadow-lg shadow-primary/20"
                        actionName="Release_Batch"
                        entityId={batch.id}
                    />
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                        <ActionGuard 
                            guard={guards.close} 
                            onClick={() => addNotification({title: "Closed", message: "Batch record finalized.", type: "success"})} 
                            label="Finalize Batch Registry" 
                            icon={Lock} 
                            variant="outline"
                            className="w-full text-white border-slate-700 hover:bg-slate-800"
                            actionName="Finalize_Batch"
                            entityId={batch.id}
                        />
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded text-[10px] text-slate-400 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                        <p>Batch finalization requires target quantity parity and 100% EOL certification coverage.</p>
                    </div>
                 </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
