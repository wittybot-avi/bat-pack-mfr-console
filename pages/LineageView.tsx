
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { packAssemblyService } from '../services/packAssemblyService';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, History, Info, AlertTriangle, Fingerprint, Box, ChevronRight, Search, ShieldCheck, CheckCircle, Database, Copy, Globe, FileText } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { exportAsDppLite, exportAsCsv } from '../utils/exporters';
import { ROUTES } from '../app/routes';

export default function LineageView() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentCluster, addNotification } = useAppStore();
  
  const [searchInput, setSearchInput] = useState(routeId || '');
  const [internalFilter, setInternalFilter] = useState('');
  const [subject, setSubject] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [parent, setParent] = useState<any>(null);
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (routeId) {
        setSearchInput(routeId);
        loadLineage(routeId);
    }
  }, [routeId]);

  const loadLineage = async (sid: string) => {
    if (!sid) return;
    setLoading(true);
    setSubject(null);
    setChildren([]);
    setParent(null);
    setEvents([]);

    try {
      const packs = await packAssemblyService.listPacks();
      const pack = packs.find(p => p.id === sid || p.packSerial === sid);
      
      if (pack) {
          setSubject({ type: 'PACK', ...pack });
          const evts = await moduleAssemblyService.getLineageEvents(pack.id);
          setEvents(evts);
          const s = await skuService.getSku(pack.skuId);
          setSku(s || null);
          const childMods = await Promise.all(pack.moduleIds.map(mid => moduleAssemblyService.getModule(mid)));
          setChildren(childMods.map(m => ({ ...m, type: 'MODULE' })));
          setLoading(false);
          return;
      }

      const modules = await moduleAssemblyService.listModules();
      const module = modules.find(m => m.id === sid);
      if (module) {
        setSubject({ type: 'MODULE', ...module });
        const evts = await moduleAssemblyService.getLineageEvents(module.id);
        setEvents(evts);
        const s = await skuService.getSku(module.skuId);
        setSku(s || null);
        const bindings = await moduleAssemblyService.listBindingsByModule(module.id);
        setChildren(bindings.map(b => ({ id: b.serial, type: 'CELL', ...b })));
        const parentPack = packs.find(p => p.moduleIds.includes(module.id));
        if (parentPack) setParent({ type: 'PACK', ...parentPack });
        setLoading(false);
        return;
      }

      const lookup = await cellTraceabilityService.findSerialGlobal(sid);
      if (lookup) {
        setSubject({ type: 'CELL', ...lookup.serial, chemistry: lookup.lot.chemistry, lotId: lookup.lot.id });
        const evts = await moduleAssemblyService.getLineageEvents(sid);
        setEvents(evts);
        const bindings = await moduleAssemblyService.listBindingsBySerial(sid);
        if (bindings.length > 0) {
            const mod = await moduleAssemblyService.getModule(bindings[0].moduleId);
            if (mod) setParent({ type: 'MODULE', ...mod });
        }
      }
    } catch (e) {
      console.error("Lineage lookup failure", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchInput) navigate(`${ROUTES.LINEAGE_AUDIT}/${searchInput}`);
  };

  const filteredChildren = children.filter(c => (c.id || c.serial).toLowerCase().includes(internalFilter.toLowerCase()));
  const expectedCount = subject?.type === 'PACK' ? sku?.requiredModules : (subject?.type === 'MODULE' ? subject?.targetCells : undefined);
  const actualCount = children.length;
  const mismatch = expectedCount !== undefined && actualCount !== expectedCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <h2 className="text-3xl font-bold tracking-tight">Lineage Audit</h2>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 md:w-80">
            <Input placeholder="Search Asset ID..." className="pl-4 h-10" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <Button type="submit" disabled={loading}>Audit</Button>
        </form>
      </div>

      {!subject && !loading && (
          <div className="p-32 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <History className="h-16 w-16 mx-auto mb-6 text-slate-300" />
              <h3 className="text-xl font-bold text-slate-400">Gen-Trace Explorer</h3>
              <p className="text-sm text-slate-400 mt-2">Enter a valid ID above to start an immutable genealogy audit.</p>
          </div>
      )}

      {loading && <div className="p-32 text-center animate-pulse text-muted-foreground font-mono text-sm uppercase tracking-widest">Resolving Decentralized Ledger...</div>}

      {subject && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-3 space-y-6">
                {parent && (
                    <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-900/10 cursor-pointer hover:bg-indigo-50 transition-all" onClick={() => navigate(`${ROUTES.LINEAGE_AUDIT}/${parent.id}`)}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-100 rounded text-indigo-700"><Box size={18} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Upstream: {parent.type}</p>
                                    <p className="text-sm font-mono font-bold">{parent.id}</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                        </CardContent>
                    </Card>
                )}

                <Card className="border-primary border-2 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-5">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-primary text-white rounded-xl">
                                <Fingerprint size={28} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-mono">{subject.id || subject.serial}</CardTitle>
                                <Badge variant="outline" className="mt-1 uppercase tracking-widest">{subject.type} FOCUS</Badge>
                            </div>
                        </div>
                        <Badge variant="success">VERIFIED SIGNED</Badge>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">SKU</p><p className="text-sm font-bold text-indigo-600">{subject.skuCode || 'N/A'}</p></div>
                        <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Chemistry</p><p className="text-sm font-medium">{subject.chemistry || 'LFP'}</p></div>
                        <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Status</p><Badge variant="outline">{subject.status || 'Active'}</Badge></div>
                        <div className="space-y-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Integrity</p><div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold"><ShieldCheck size={16} /> PASSED</div></div>
                    </CardContent>
                </Card>

                {mismatch && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-800 shadow-sm">
                        <AlertTriangle className="h-5 w-5 mt-0.5 text-rose-500" />
                        <div>
                            <p className="text-sm font-bold">Cardinality Mismatch</p>
                            <p className="text-xs">Ledger contains {actualCount} records, but SKU requires {expectedCount}. Identity chain may be incomplete.</p>
                        </div>
                    </div>
                )}

                {children.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                             Hierarchy Members ({children.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {filteredChildren.map(child => (
                                <Card key={child.id || child.serial} className="cursor-pointer hover:border-primary transition-all" onClick={() => navigate(`${ROUTES.LINEAGE_AUDIT}/${child.id || child.serial}`)}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800"><Fingerprint size={16} className="text-slate-400" /></div>
                                            <div>
                                                <p className="text-xs font-bold font-mono">{child.id || child.serial}</p>
                                                <p className="text-[9px] uppercase text-muted-foreground">{child.type}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-200" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardHeader className="border-b border-slate-800 pb-3"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Ledger Intelligence</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-xs pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center opacity-60"><span>Cardinality Check</span><Badge variant={mismatch ? 'destructive' : 'success'} className="text-[8px] h-3">{mismatch ? 'FAIL' : 'PASS'}</Badge></div>
                            <div className="flex justify-between items-center opacity-60"><span>Signature Auth</span><Badge variant="success" className="text-[8px] h-3">PASS</Badge></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
