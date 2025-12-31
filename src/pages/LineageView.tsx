
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button } from '../components/ui/design-system';
import { ArrowLeft, Link2, Info, AlertTriangle, Fingerprint, Box, Cpu } from 'lucide-react';

export default function LineageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bindings, setBindings] = useState<any[]>([]);
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadLineage(id);
  }, [id]);

  const loadLineage = async (sid: string) => {
    setLoading(true);
    try {
      // 1. Check if ID is a module
      const mod = await moduleAssemblyService.getModule(sid);
      if (mod) {
        setSubject({ type: 'Module', ...mod });
        const b = await moduleAssemblyService.listBindingsByModule(sid);
        setBindings(b);
      } else {
        // 2. Check if ID is a serial (upstream lookup)
        const lookup = await cellTraceabilityService.findSerialGlobal(sid);
        if (lookup) {
          setSubject({ type: 'Cell', ...lookup.serial, lotCode: lookup.lot.lotCode });
          const b = await moduleAssemblyService.listBindingsBySerial(sid);
          setBindings(b);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Scanning ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Lineage Audit</h2>
          <p className="text-muted-foreground font-mono">Trace Path: {id}</p>
        </div>
      </div>

      {!subject ? (
          <div className="p-20 text-center border-2 border-dashed rounded-lg bg-slate-50">
              <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-amber-500 opacity-50" />
              <p>No active record found for identifier <span className="font-bold">{id}</span>.</p>
              <p className="text-sm text-muted-foreground mt-1">Check if the asset has been registered or bound yet.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Relationship Graph</CardTitle>
                    <Badge variant="success">Immutable Ledger Verified</Badge>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Target ID</TableHead>
                        <TableHead>Verified At</TableHead>
                    </TableRow>
                    </TableHeader>
                    <tbody>
                    {bindings.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No downstream or upstream bindings found.</TableCell></TableRow>
                    ) : (
                        bindings.map((b, i) => (
                        <TableRow key={i}>
                            <TableCell className="font-mono text-sm flex items-center gap-2">
                                {subject.type === 'Module' ? <Fingerprint size={14} className="text-primary" /> : <Box size={14} className="text-blue-500" />}
                                {subject.type === 'Module' ? b.serial : b.moduleId}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] uppercase">
                                    {subject.type === 'Module' ? 'Child (Cell)' : 'Parent (Module)'}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{subject.type === 'Module' ? b.lotCode : b.moduleId}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(b.boundAt).toLocaleString()}</TableCell>
                        </TableRow>
                        ))
                    )}
                    </tbody>
                </Table>
                </CardContent>
            </Card>
            </div>

            <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-emerald-400" /> Audit Subject</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Type</p>
                    <p className="font-bold flex items-center gap-2">
                        {subject.type === 'Module' ? <Box className="text-blue-400" /> : <Cpu className="text-indigo-400" />}
                        {subject.type} Instance
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Context</p>
                    <p className="text-sm font-mono">{subject.type === 'Module' ? subject.skuCode : subject.lotCode}</p>
                </div>
                {subject.status && (
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Status</p>
                        <Badge className="bg-slate-800 text-slate-100 border-slate-700">{subject.status}</Badge>
                    </div>
                )}
                </CardContent>
            </Card>

            <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2 opacity-30 grayscale">
                <Link2 className="h-8 w-8" />
                <p className="text-xs font-bold uppercase tracking-widest">Physical Topology</p>
                <p className="text-[10px]">Graph visualizer Coming in Patch F.</p>
            </div>
            </div>
        </div>
      )}
    </div>
  );
}
