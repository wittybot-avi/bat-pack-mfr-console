import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { PackInstance, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button } from '../components/ui/design-system';
import { ClipboardCheck, ShieldAlert, ArrowRight, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { StageHeader } from '../components/SopGuidedUX';

export default function EolReview() {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<PackInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompleted();
  }, []);

  const loadCompleted = async () => {
    setLoading(true);
    const data = await eolQaService.listEolQueue();
    // Filter only those that have a final disposition
    const completed = data.filter(p => p.status === PackStatus.PASSED || p.status === PackStatus.QUARANTINED || p.status === PackStatus.SCRAPPED);
    setPacks(completed);
    setLoading(false);
  };

  return (
    <div className="pb-12">
      <StageHeader 
        stageCode="REV"
        title="EOL Quality Review"
        objective="Review and audit recently certified or non-conforming assets from the EOL station."
        entityLabel="Review Dashboard"
        status="ACTIVE"
        diagnostics={{ route: '/assure/eol/review', entityId: 'QA-REV-01' }}
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recently Processed Assets</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Pack ID</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
                ) : packs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">No completed test records found in recent ledger.</TableCell></TableRow>
                ) : (
                  packs.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(`/assure/eol/details/${p.id}`)}>
                      <TableCell className="font-mono font-bold">{p.id}</TableCell>
                      <TableCell className="font-mono text-xs">{p.packSerial || 'N/A'}</TableCell>
                      <TableCell>
                         {p.eolStatus === 'PASS' ? (
                             <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                 <CheckCircle size={14} /> PASS
                             </div>
                         ) : (
                             <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                                 <XCircle size={14} /> {p.eolStatus}
                             </div>
                         )}
                      </TableCell>
                      <TableCell className="text-sm">{p.eolPerformedBy || 'System'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.eolTimestamp ? new Date(p.eolTimestamp).toLocaleString() : '-'}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="sm" className="gap-2">Audit <ArrowRight size={14} /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}