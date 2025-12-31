
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eolQaService } from '../services/eolQaService';
import { PackInstance, PackStatus } from '../domain/types';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button } from '../components/ui/design-system';
import { ClipboardCheck, Play, History, ShieldAlert, ArrowRight, Loader2, Search, Filter } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function EolQaList() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [packs, setPacks] = useState<PackInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'passed' | 'failed'>('queue');

  useEffect(() => {
    loadQueue();
  }, [activeTab]);

  const loadQueue = async () => {
    setLoading(true);
    let statusFilter: PackStatus | undefined;
    if (activeTab === 'passed') statusFilter = PackStatus.PASSED;
    if (activeTab === 'failed') statusFilter = PackStatus.QUARANTINED;
    
    const data = await eolQaService.listEolQueue({ status: statusFilter });
    
    // Manual filter for "queue" tab if no specific status filter
    let filtered = data;
    if (activeTab === 'queue') {
      filtered = data.filter(p => p.status === PackStatus.READY_FOR_EOL || p.status === PackStatus.IN_EOL_TEST);
    }

    setPacks(filtered);
    setLoading(false);
  };

  const getStatusBadge = (status: PackStatus) => {
    switch (status) {
      case PackStatus.PASSED: return <Badge variant="success">PASSED</Badge>;
      case PackStatus.QUARANTINED: return <Badge variant="destructive">QUARANTINED</Badge>;
      case PackStatus.IN_EOL_TEST: return <Badge className="bg-blue-500 text-white">TESTING</Badge>;
      case PackStatus.READY_FOR_EOL: return <Badge variant="outline">QUEUED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">EOL Quality Assurance</h2>
          <p className="text-muted-foreground">Final testing gate before inventory release and dispatch.</p>
        </div>
      </div>

      <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
        <button 
          className={`pb-2 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'queue' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'}`} 
          onClick={() => setActiveTab('queue')}
        >
          <Play size={14} /> Active Queue
        </button>
        <button 
          className={`pb-2 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'passed' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'}`} 
          onClick={() => setActiveTab('passed')}
        >
          <ClipboardCheck size={14} /> Certified (Pass)
        </button>
        <button 
          className={`pb-2 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'failed' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'}`} 
          onClick={() => setActiveTab('failed')}
        >
          <ShieldAlert size={14} /> Non-conforming (Fail)
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Build ID</TableHead>
                <TableHead>Pack Serial</TableHead>
                <TableHead>SKU Blueprint</TableHead>
                <TableHead>BMS UID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell></TableRow>
              ) : packs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">No packs found in {activeTab} stage.</TableCell></TableRow>
              ) : (
                packs.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(`/assure/eol/${p.id}`)}>
                    <TableCell className="font-mono font-bold text-primary">{p.id}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{p.packSerial || 'N/A'}</TableCell>
                    <TableCell>{p.skuCode}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{p.bmsId || '-'}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.updatedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="gap-2">Open <ArrowRight size={14} /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
