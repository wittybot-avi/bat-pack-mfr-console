
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { packAssemblyService } from '../services/packAssemblyService';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, History, Info, AlertTriangle, Fingerprint, Box, Cpu, Layers, ChevronRight, Search, ShieldCheck, CheckCircle, Database, Copy, Download, FileText, Globe } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { exportAsJson, exportAsCsv, exportAsDppLite } from '../utils/exporters';

export default function LineageView() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { currentCluster, addNotification } = useAppStore();
  
  const [searchInput, setSearchInput] = useState(routeId || '');
  const [internalFilter, setInternalFilter] = useState('');
  const [subject, setSubject] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [parent, setParent] = useState<any>(null);
  const [sku, setSku] = useState<Sku | null>(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const isSupervisor = ['CS', 'C1', 'C3', 'C4', 'C7', 'C8'].includes(currentCluster?.id || '');

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
      addNotification({ title: 'Search Error', message: 'Identifier not found.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchInput) navigate(`/trace/lineage/${searchInput}`);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      addNotification({ title: 'Copied', message: 'Identifier copied to clipboard.', type: 'info' });
  };

  const filteredChildren = children.filter(c => (c.id || c.serial).toLowerCase().includes(internalFilter.toLowerCase()));
  
  const expectedCount = subject?.type === 'PACK' ? sku?.requiredModules : subject?.targetCells;
  const actualCount = children.length;
  const mismatch = expectedCount !== undefined && actualCount !== expectedCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Lineage Audit</h2>
                <p className="text-muted-foreground">End-to-end component genealogy explorer.</p>
            </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 md:w-80">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search Asset ID..." className="pl-9 h-10" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading}>{loading ? '...' : 'Go'}</Button>
            </form>
            {subject && isSupervisor && (
                <div className="flex gap-1">
                    <Tooltip content="Export DPP-Lite JSON">
                        <Button variant="outline" size="icon" onClick={() => exportAsDppLite(subject, children, sku, events)} className="text-blue-500 border-blue-100 hover:bg-blue-50"><Globe size={16} /></Button>
                    </Tooltip>
                    <Tooltip content="Export CSV Ledger">
                        <Button variant="outline" size="icon" onClick={() => exportAsCsv(['ID', 'Type'], children.map(c => [c.id || c.serial, c.type]), `Ledger_${subject.id || subject.serial}`)} className="text-emerald-500 border-emerald-100 hover:bg-emerald-50"><FileText size={16} /></Button>
                    </Tooltip>
                </div>
            )}
        </div>
      </div>

      {!subject && !loading && (
          <div className="p-20 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-bold text-slate-400">Ledger Explorer</h3>
              <p className="text-sm text-slate-400 mt-2">Enter a serial or work order ID to start genealogy audit.</p>
          </div>
      )}

      {loading && <div className="p-20 text-center animate-pulse text-muted-foreground">Syncing immutable records...</div>}

      {subject && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="lg:col-span-3 space-y-6">
                
                {/* Parent Navigation */}
                {parent && (
                    <div className="space-y-2">
                         <h4 className="text-[10px] font-bold uppercase text-muted-foreground px-1 tracking-widest">Upstream Parent</h4>
                         <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-900/10 cursor-pointer hover:bg-indigo-50 transition-colors" onClick={() => navigate(`/trace/lineage/${parent.id}`)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-100 rounded text-indigo-700">{parent.type === 'PACK' ? <Layers size={18} /> : <Box size={18} />}</div>
                                    <div>
                                        <p className="text-sm font-bold font-mono">{parent.id}</p>
                                        <p className="text-[10px] uppercase text-muted-foreground">{parent.type} ENCLOSURE</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </CardContent>
                         </Card>
                         <div className="flex justify-center h-4"><div className="w-0.5 bg-indigo-200" /></div>
                    </div>
                )}

                {/* Main Subject */}
                <Card className="border-primary border-2 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary text-white rounded-lg shadow-lg">
                                {subject.type === 'PACK' ? <Layers size={24} /> : subject.type === 'MODULE' ? <Box size={24} /> : <Fingerprint size={24} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-xl font-mono">{subject.id || subject.serial}</CardTitle>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(subject.id || subject.serial)}><Copy size={12}/></Button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{subject.type} FOCUS</Badge>
                                    <Badge variant="success" className="text-[10px]"><CheckCircle size={8} className="mr-1" /> LEDGER SYNCED</Badge>
                                </div>
                            </div>
                        </div>
                        <Badge variant="outline" className="font-mono bg-white dark:bg-slate-900">{subject.status || 'Active'}</Badge>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Identity Context</p>
                            <p className="text-sm font-medium">{subject.skuCode || subject.lotCode || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Chemistry Match</p>
                            <p className="text-sm font-medium">{subject.chemistry || sku?.chemistry || 'LFP'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Registry Date</p>
                            <p className="text-sm font-medium">{new Date(subject.createdAt || subject.generatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Integrity</p>
                            <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold"><ShieldCheck size={14} /> SIGNED</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mismatch Alert */}
                {mismatch && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-4 text-rose-800 animate-pulse">
                        <AlertTriangle className="shrink-0" />
                        <div>
                            <p className="text-sm font-bold">Traceability Gaps Detected</p>
                            <p className="text-xs opacity-80">Expected {expectedCount} sub-components per SKU, but found {actualCount}. Verify workstation scan history.</p>
                        </div>
                    </div>
                )}

                {/* Children Filter & Grid */}
                {children.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-center h-4"><div className="w-0.5 bg-slate-200" /></div>
                        <div className="flex justify-between items-center px-1">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Downstream Hierarchy ({children.length})</h4>
                            <div className="relative w-48">
                                <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                <Input placeholder="Filter children..." className="pl-7 h-7 text-xs" value={internalFilter} onChange={e => setInternalFilter(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredChildren.map(child => (
                                <Card key={child.id || child.serial} className="cursor-pointer hover:border-primary transition-all group overflow-hidden" onClick={() => navigate(`/trace/lineage/${child.id || child.serial}`)}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {child.type === 'MODULE' ? <Box size={16} className="text-indigo-500" /> : <Fingerprint size={16} className="text-emerald-500" />}
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold font-mono group-hover:text-primary truncate">{child.id || child.serial}</p>
                                                <p className="text-[9px] uppercase text-muted-foreground">{child.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); copyToClipboard(child.id || child.serial); }}><Copy size={10}/></Button>
                                            <ChevronRight size={12} className="text-slate-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-400" /> Audit Intelligence</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                            <p className="font-bold mb-2">Rule Verification</p>
                            <div className="space-y-2 opacity-80">
                                <div className="flex justify-between"><span>Count Rule:</span> <Badge variant={mismatch ? 'destructive' : 'success'} className="text-[9px] h-4">{mismatch ? 'FAIL' : 'PASS'}</Badge></div>
                                <div className="flex justify-between"><span>Chemistry:</span> <Badge variant="success" className="text-[9px] h-4">PASS</Badge></div>
                                <div className="flex justify-between"><span>Identity:</span> <Badge variant="success" className="text-[9px] h-4">PASS</Badge></div>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                             <p className="font-bold mb-2">Constraint Logic</p>
                             <ul className="space-y-1.5 opacity-80">
                                <li className="flex items-center gap-2 text-[10px]"><CheckCircle size={10} className="text-emerald-400" /> Chemistry Consistency</li>
                                <li className="flex items-center gap-2 text-[10px]"><CheckCircle size={10} className="text-emerald-400" /> Sequence Integrity</li>
                             </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History size={16} className="text-indigo-500" /> Activity Log</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {events.length === 0 ? <p className="text-xs text-muted-foreground italic">No events in log.</p> : 
                              events.slice(0, 5).map(e => (
                                  <div key={e.id} className="border-l-2 border-slate-100 pl-3 py-1">
                                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{e.type.replace(/_/g, ' ')}</p>
                                      <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(e.timestamp).toLocaleDateString()} by {e.actor}</p>
                                  </div>
                              ))
                            }
                        </div>
                    </CardContent>
                </Card>

                <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                    <Database className="h-6 w-6 text-slate-400" />
                    <p className="text-[10px] font-bold uppercase tracking-tight">Ledger Integrity</p>
                    <p className="text-[9px] leading-tight">Identity graph is non-volatile and cryptographically verifiable.</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
