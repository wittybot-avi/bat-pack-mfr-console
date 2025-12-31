import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cellLotService, ScanEvent } from '../services/cellLotService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button } from '../components/ui/design-system';
import { ArrowLeft, Link2, Info, AlertTriangle } from 'lucide-react';

export default function LineageView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanEvent[]>([]);

  useEffect(() => {
    if (id) {
      cellLotService.getLineage(id).then(setScans);
    }
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Lineage Audit</h2>
          <p className="text-muted-foreground">Asset Traceability: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Component Map</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {scans.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No components bound to this asset record.</TableCell></TableRow>
                  ) : (
                    scans.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm">{s.serial}</TableCell>
                        <TableCell>{s.targetType} ({s.targetId})</TableCell>
                        <TableCell className="text-xs">{new Date(s.timestamp).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="success">{s.outcome}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" /> Rule Compliance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between text-sm">
                  <span>Target Count:</span>
                  <span className="font-bold">16 Cells</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span>Actual Count:</span>
                  <span className="font-bold">{scans.length} Cells</span>
               </div>
               {scans.length < 16 && (
                 <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 text-amber-800 dark:text-amber-200 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>Mismatch detected: Bound count ({scans.length}) is less than SKU specification (16).</p>
                 </div>
               )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Module Assembly</CardTitle></CardHeader>
            <CardContent className="text-center py-6 text-muted-foreground text-sm">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Physical topology visualization Coming Soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}