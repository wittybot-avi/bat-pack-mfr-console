import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cellService, CellLot } from '../services/cellService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input } from '../components/ui/design-system';
import { Plus, Search, Fingerprint, ExternalLink, Filter, Loader2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function CellLotsList() {
  const navigate = useNavigate();
  const { currentCluster } = useAppStore();
  const [lots, setLots] = useState<CellLot[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await cellService.listLots();
    setLots(data);
    setLoading(false);
  };

  const filtered = lots.filter(l => 
    l.lotCode.toLowerCase().includes(search.toLowerCase()) || 
    l.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = ['C2', 'CS'].includes(currentCluster?.id || '');

  // Derived KPIs
  const totalQty = lots.reduce((acc, l) => acc + l.quantityReceived, 0);
  const draftLots = lots.filter(l => l.status === 'DRAFT').length;
  const publishedLots = lots.filter(l => l.status === 'PUBLISHED').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cell Traceability</h2>
          <p className="text-muted-foreground">Manage incoming cell shipments and serialization cycles.</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/cells/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Cell Lot
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Total Lots</p>
                  <p className="text-2xl font-bold">{lots.length}</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Total Cells</p>
                  <p className="text-2xl font-bold">{totalQty.toLocaleString()}</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase font-bold">In Draft</p>
                  <p className="text-2xl font-bold text-amber-500">{draftLots}</p>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Published</p>
                  <p className="text-2xl font-bold text-emerald-500">{publishedLots}</p>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search lot code or supplier..." 
                className="pl-9" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Code</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Chemistry</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No cell lots found.</TableCell></TableRow>
              ) : (
                filtered.map(lot => (
                  <TableRow key={lot.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => navigate(`/cells/${lot.id}`)}>
                    <TableCell className="font-mono font-bold text-primary">{lot.lotCode}</TableCell>
                    <TableCell>{lot.supplierName}</TableCell>
                    <TableCell><Badge variant="secondary">{lot.chemistry}</Badge></TableCell>
                    <TableCell>{lot.quantityReceived}</TableCell>
                    <TableCell>
                      <Badge variant={
                          lot.status === 'PUBLISHED' ? 'success' : 
                          lot.status === 'DRAFT' ? 'secondary' : 'default'
                      }>{lot.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{lot.receivedDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/cells/${lot.id}`); }}>
                            Open <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
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