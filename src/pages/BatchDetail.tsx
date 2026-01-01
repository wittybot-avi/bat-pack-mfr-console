import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { batchService } from '../services/api';
import { Batch, BatchStatus, BatchNote } from '../domain/types';
import { useAppStore } from '../lib/store';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '../components/ui/design-system';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Lock, PlayCircle } from 'lucide-react';
import { workflowGuardrails, STATUS_LABELS } from '../services/workflowGuardrails';
import { GatedAction, NextStepPrompt } from '../components/WorkflowGuards';

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

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCluster, currentRole, addNotification } = useAppStore();
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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

  const clusterId = currentCluster?.id || '';
  const guard = batch ? workflowGuardrails.getBatchGuardrail(batch, clusterId) : null;
  const nextStep = batch ? workflowGuardrails.getNextRecommendedStep(batch, 'BATCH') : null;

  const handleRelease = async () => {
    if (!batch) return;
    try {
        await batchService.updateBatch(batch.id, { status: BatchStatus.IN_PRODUCTION });
        addNotification({ title: "Released", message: "Batch sent to assembly line.", type: "success" });
        loadBatch(batch.id);
    } catch (e) {
        addNotification({ title: "Error", message: "Action failed", type: "error" });
    }
  };

  if (loading || !batch) return <div className="p-10 text-center animate-pulse">Synchronizing batch ledger...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/batches')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{batch.batchNumber}</h2>
                <Badge variant={batch.status === BatchStatus.CLOSED ? 'success' : 'default'}>
                    {batch.status === BatchStatus.CLOSED ? STATUS_LABELS.COMPLETED : batch.status === BatchStatus.ON_HOLD ? STATUS_LABELS.BLOCKED : STATUS_LABELS.IN_PROGRESS}
                </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{batch.sku}</p>
          </div>
        </div>

        <NextStepPrompt step={nextStep} />

        <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
            <button className={`pb-2 border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`pb-2 border-b-2 ${activeTab === 'qa' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('qa')}>QA / EOL</button>
        </div>

        <div className="pt-2">
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Key Metrics</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-muted-foreground">Target Qty</p><p className="text-xl font-bold">{batch.targetQuantity}</p></div>
                            <div><p className="text-xs text-muted-foreground">Built Qty</p><p className="text-xl font-bold">{batch.qtyBuilt}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Process Audit</CardTitle></CardHeader>
                        <CardContent className="max-h-[200px] overflow-y-auto">
                            {batch.notes.length === 0 ? <p className="text-sm text-muted-foreground italic">No events recorded.</p> : batch.notes.map(note => <NoteItem key={note.id} note={note} />)}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-4 shrink-0">
         <Card>
             <CardHeader className="pb-2"><CardTitle className="text-base">Operations Hub</CardTitle></CardHeader>
             <CardContent className="space-y-3">
                 {batch.status === BatchStatus.DRAFT && guard && (
                    <GatedAction 
                      guard={guard.releaseToLine} 
                      onClick={handleRelease} 
                      label="Release to Line" 
                      icon={PlayCircle} 
                      className="w-full"
                    />
                 )}
                 
                 {batch.status !== BatchStatus.CLOSED && guard && (
                    <div className="pt-4 border-t space-y-2">
                         <GatedAction 
                            guard={guard.closeBatch} 
                            onClick={() => addNotification({title: "Coming Soon", message: "Final closure requires all units at EOL PASS.", type: "info"})} 
                            label="Finalize Batch" 
                            icon={Lock} 
                            variant="outline"
                            className="w-full"
                         />
                    </div>
                 )}
             </CardContent>
         </Card>
      </div>
    </div>
  );
}