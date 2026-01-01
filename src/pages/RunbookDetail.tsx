import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/ui/design-system';
import { ArrowLeft, CheckCircle, Circle, Lock, ExternalLink, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { StageHeader } from '../components/SopGuidedUX';
import { workflowGuardrails } from '../services/workflowGuardrails';

// Mock Step Definitions
const RUNBOOK_STEPS: Record<string, any[]> = {
  'mfg-run': [
    { id: 'S1', title: 'Design Definition', objective: 'Select and authorize SKU blueprint.', route: '/sku', role: 'Engineering' },
    { id: 'S3', title: 'Batch Authorization', objective: 'Authorize production lot and release to floor.', route: '/batches', role: 'Supervisor' },
    { id: 'S5', title: 'Module Integration', objective: 'Bind cell units to module lattice.', route: '/operate/modules', role: 'Operator' },
    { id: 'S6', title: 'Pack Final Assembly', objective: 'Integrate modules and bind BMS.', route: '/operate/packs', role: 'Operator' },
    { id: 'S7', title: 'EOL Testing', objective: 'Execute final electrical verification.', route: '/eol', role: 'QA' },
    { id: 'S9', title: 'Asset Certification', objective: 'Generate digital compliance certificate.', route: '/eol', role: 'QA' }
  ],
  'cell-receipt': [
    { id: 'S2', title: 'Cell Serialization', objective: 'Register shipment and generate unique IDs.', route: '/trace/cells', role: 'Logistics' },
    { id: 'S4', title: 'Digital Binding', objective: 'Verify physical SN presence in decentralized ledger.', route: '/trace/cells', role: 'Operator' }
  ],
  'logistics-transfer': [
    { id: 'S10', title: 'Dispatch Creation', objective: 'Group certified units for shipment.', route: '/dispatch', role: 'Logistics' },
    { id: 'S11', title: 'Chain of Custody', objective: 'Formal handover to carrier.', route: '/custody', role: 'Logistics' },
    { id: 'S12', title: 'Final Acceptance', objective: 'Sign-off at destination dock.', route: '/custody', role: 'External' }
  ],
  'warranty-claims': [
    { id: 'S13', title: 'Claim Intake', objective: 'Submit field report with evidence.', route: '/warranty/intake', role: 'External' },
    { id: 'S14', title: 'Technical RCA', objective: 'Analyze telemetry and physical state.', route: '/warranty', role: 'Engineering' },
    { id: 'S15', title: 'Final Disposition', objective: 'Repair/Replace/Scrap decision.', route: '/warranty', role: 'Supervisor' }
  ]
};

const RUNBOOK_META: Record<string, any> = {
  'mfg-run': { title: 'Manufacturing Execution Run', objective: 'End-to-end shopfloor production flow.' },
  'cell-receipt': { title: 'Material Receipt & Serialization', objective: 'Secure material intake and identity generation.' },
  'logistics-transfer': { title: 'Dispatch & Custody Chain', objective: 'Secure asset transfer across supply chain nodes.' },
  'warranty-claims': { title: 'Warranty Lifecycle Management', objective: 'Formal resolution of field anomalies.' }
};

export default function RunbookDetail() {
  const { runbookId } = useParams();
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  
  const steps = runbookId ? RUNBOOK_STEPS[runbookId] : [];
  const meta = runbookId ? RUNBOOK_META[runbookId] : null;

  if (!runbookId || !meta) return <div className="p-20 text-center">Runbook not found.</div>;

  return (
    <div className="pb-12 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/runbooks')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Runbooks
        </Button>
      </div>

      <StageHeader 
        stageCode="GUIDE"
        title={meta.title}
        objective={meta.objective}
        entityLabel="Process Guide"
        status="ACTIVE"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-12 py-4">
           {steps.map((step, index) => {
             // Basic role check simulation
             const isPartner = currentCluster?.id === 'C9';
             const isOperator = currentCluster?.id === 'C2';
             const isQA = currentCluster?.id === 'C3';
             
             let blocked = false;
             let reason = "";

             if (step.role === 'QA' && !isQA && currentCluster?.id !== 'CS') {
                 blocked = true;
                 reason = "Requires C3 (QA) Cluster permissions.";
             }
             if (step.role === 'External' && !isPartner && currentCluster?.id !== 'CS') {
                 blocked = true;
                 reason = "Requires C9 (External Partner) authorization.";
             }

             return (
               <div key={step.id} className="relative">
                  {/* Spine Indicator */}
                  <div className={`absolute -left-[41px] h-6 w-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-950 z-10 ${blocked ? 'border-slate-200 text-slate-300' : 'border-primary text-primary shadow-[0_0_10px_rgba(79,70,229,0.2)]'}`}>
                    <span className="text-[10px] font-bold">{step.id}</span>
                  </div>

                  <Card className={`overflow-hidden transition-all ${blocked ? 'opacity-70 grayscale-[0.5]' : 'hover:border-primary/50 hover:shadow-md'}`}>
                    <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{step.title}</h3>
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter bg-slate-100">{step.role}</Badge>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{step.objective}</p>
                            
                            {blocked ? (
                                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded p-3 flex items-start gap-2">
                                    <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{reason}</p>
                                </div>
                            ) : (
                                <Button onClick={() => navigate(step.route)} size="sm" variant="outline" className="gap-2 hover:bg-primary hover:text-white transition-colors">
                                    Go to Workstation <ExternalLink size={14} />
                                </Button>
                            )}
                        </div>

                        {/* Visual Progress Guide */}
                        <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l">
                            {index === 0 && !blocked ? (
                                <div className="text-center space-y-2">
                                    <div className="h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle size={20} />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase text-emerald-600">Start Here</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-2">
                                    <div className={`h-8 w-8 rounded-full border-2 border-dashed flex items-center justify-center mx-auto ${blocked ? 'border-slate-300' : 'border-slate-300'}`}>
                                        <Circle size={16} className="text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Target Stage</p>
                                </div>
                            )}
                        </div>
                    </div>
                  </Card>
               </div>
             );
           })}
        </div>

        <Card className="bg-primary/5 border-primary/20 border-2 border-dashed">
            <CardContent className="p-6 flex items-center gap-6">
                <BookOpen className="h-10 w-10 text-primary opacity-50 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-bold">Operational Context Registry</h4>
                    <p className="text-sm text-muted-foreground">Detailed work instructions and hazard maps are linked within the primary workstations. Ensure protective gear is active at all manual assembly points.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}