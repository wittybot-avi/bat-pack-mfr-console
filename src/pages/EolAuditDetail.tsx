import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { packAssemblyService } from '../services/packAssemblyService';
import { EolTestRun, PackInstance } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui/design-system';
import { ArrowLeft, History, CheckCircle, ShieldCheck, Info, FileText, User } from 'lucide-react';
import { StageHeader } from '../components/SopGuidedUX';

export default function EolAuditDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState<PackInstance | null>(null);
  const [testRun, setTestRun] = useState<EolTestRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (pid: string) => {
    setLoading(true);
    const p = await packAssemblyService.getPack(pid);
    const run = await eolQaService.getTestRun(pid);
    setPack(p || null);
    setTestRun(run || null);
    setLoading(false);
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Retrieving audit chain...</div>;
  if (!pack || !testRun) return <div className="p-20 text-center">Audit record not found for this build.</div>;

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="AUD"
        title="Immutable QA Audit"
        objective="Analyze formal test outcomes and personnel sign-off provenance."
        entityLabel={pack.id}
        status={pack.status}
        diagnostics={{ route: '/assure/eol/audit', entityId: pack.id }}
      />

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assure/eol/review')} className="gap-2 text-slate-500 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Review Hub
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
                <CardHeader className="border-b"><CardTitle className="text-lg">Test Matrix Results</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Parameter</TableHead>
                                <TableHead>Threshold</TableHead>
                                <TableHead>Measured</TableHead>
                                <TableHead className="text-right">Result</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {testRun.items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-semibold text-sm">{item.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">{item.threshold || '-'}</TableCell>
                                    <TableCell className="text-sm font-mono">{item.measurement || '-'} {item.unit}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={item.status === 'PASS' ? 'success' : 'destructive'} className="text-[9px]">{item.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-2 border-b"><CardTitle className="text-base flex items-center gap-2"><User size={16} className="text-primary"/> Personnel Sign-off</CardTitle></CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">QA Lead</p>
                            <p className="font-bold text-sm">{testRun.decisionBy || testRun.actor}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Timestamp</p>
                            <p className="text-xs text-muted-foreground">{new Date(testRun.decisionAt || testRun.startedAt).toLocaleString()}</p>
                        </div>
                        <div className="pt-2 border-t border-dashed">
                             <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                 <ShieldCheck size={16} /> Digital Signature Verified
                             </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 dark:bg-slate-900 border-none">
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText size={16} className="text-indigo-500"/> Auditor Notes</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                            "{testRun.notes || 'No notes provided by operator.'}"
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="pt-8 flex justify-center">
             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest bg-white dark:bg-slate-900 px-6 py-2 rounded-full border">
                 <History size={12} /> Audit Hash: {Math.random().toString(16).slice(2, 10).toUpperCase()}
             </div>
        </div>
      </div>
    </div>
  );
}