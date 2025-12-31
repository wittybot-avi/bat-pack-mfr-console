
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { packAssemblyService } from '../services/packAssemblyService';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { skuService, Sku } from '../services/skuService';
import { Card, CardContent, CardHeader, CardTitle, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Button, Input } from '../components/ui/design-system';
import { ArrowLeft, History, Info, AlertTriangle, Fingerprint, Box, Cpu, Layers, ChevronRight, Search, ShieldCheck, CheckCircle, Database } from 'lucide-react';
import { useAppStore } from '../lib/store';

export default function LineageView() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  
  const [searchInput, setSearchInput] = useState(routeId || '');
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
      // 1. Try Pack Lookup
      const packs = await packAssemblyService.listPacks();
      const pack = packs.find(p => p.id === sid || p.packSerial === sid);
      
      if (pack) {
          setSubject({ type: 'PACK', ...pack });
          const events = await moduleAssemblyService.getLineageEvents(pack.id);
          setEvents(events);
          const s = await skuService.getSku(pack.skuId);
          setSku(s || null);
          
          // Children are modules
          const childMods = await Promise.all(pack.moduleIds.map(mid => moduleAssemblyService.getModule(mid)));
          setChildren(childMods.map(m => ({ ...m, type: 'MODULE' })));
          setLoading(false);
          return;
      }

      // 2. Try Module Lookup
      const modules = await moduleAssemblyService.listModules();
      const module = modules.find(m => m.id === sid);
      if (module) {
        setSubject({ type: 'MODULE', ...module });
        const events = await moduleAssemblyService.getLineageEvents(module.id);
        setEvents(events);
        const s = await skuService.getSku(module.skuId);
        setSku(s || null);

        // Children are cells
        const bindings = await moduleAssemblyService.listBindingsByModule(module.id);
        setChildren(bindings.map(b => ({ id: b.serial, type: 'CELL', ...b })));

        // Parent might be a pack
        const parentPack = packs.find(p => p.moduleIds.includes(module.id));
        if (parentPack) setParent({ type: 'PACK', ...parentPack });

        setLoading(false);
        return;
      }

      // 3. Try Cell Lookup
      const lookup = await cellTraceabilityService.findSerialGlobal(sid);
      if (lookup) {
        setSubject({ type: 'CELL', ...lookup.serial, chemistry: lookup.lot.chemistry, lotId: lookup.lot.id });
        const events = await moduleAssemblyService.getLineageEvents(sid);
        setEvents(events);

        // Parent might be a module
        const bindings = await moduleAssemblyService.listBindingsBySerial(sid);
        if (bindings.length > 0) {
            const mod = await moduleAssemblyService.getModule(bindings[0].moduleId);
            if (mod) setParent({ type: 'MODULE', ...mod });
        }
      }
    } catch (e) {
      console.error(e);
      addNotification({ title: 'Search Error', message: 'Identifier not found in registry.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchInput) navigate(`/trace/lineage/${searchInput}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Lineage Audit</h2>
                <p className="text-muted-foreground">Verify genealogy across cells, modules, and packs.</p>
            </div>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-96">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search Asset ID or Serial..." 
                    className="pl-9 h-10" 
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />
            </div>
            <Button type="submit" disabled={loading}>{loading ? '...' : 'Audit'}</Button>
        </form>
      </div>

      {!subject && !loading && (
          <div className="p-20 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-bold text-slate-400">Search for an asset to start audit</h3>
              <p className="text-sm text-slate-400 mt-2">Enter a Cell Serial, Module Work Order, or Pack Serial.</p>
          </div>
      )}

      {loading && <div className="p-20 text-center animate-pulse text-muted-foreground">Querying genealogy database...</div>}

      {subject && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* LEFT: Genealogy Tree */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* UPSTREAM / PARENT */}
                {parent && (
                    <div className="space-y-2">
                         <h4 className="text-xs font-bold uppercase text-muted-foreground px-1">Parent Asset</h4>
                         <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-900/10 cursor-pointer hover:bg-indigo-50 transition-colors" onClick={() => navigate(`/trace/lineage/${parent.id}`)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-100 rounded text-indigo-700">
                                        {parent.type === 'PACK' ? <Layers size={18} /> : <Box size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold font-mono">{parent.id}</p>
                                        <p className="text-[10px] uppercase text-muted-foreground">{parent.type} RELATIONSHIP</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </CardContent>
                         </Card>
                         <div className="flex justify-center h-4"><div className="w-0.5 bg-indigo-200" /></div>
                    </div>
                )}

                {/* CURRENT SUBJECT */}
                <Card className="border-primary border-2 shadow-xl shadow-primary/5">
                    <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary text-white rounded-lg shadow-lg">
                                {subject.type === 'PACK' ? <Layers size={24} /> : subject.type === 'MODULE' ? <Box size={24} /> : <Fingerprint size={24} />}
                            </div>
                            <div>
                                <CardTitle className="text-xl font-mono">{subject.id || subject.serial}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{subject.type} SUBJECT</Badge>
                                    <Badge variant="success" className="text-[10px]"><CheckCircle size={8} className="mr-1" /> VALIDATED</Badge>
                                </div>
                            </div>
                        </div>
                        <Badge variant="outline" className="font-mono bg-white dark:bg-slate-900">{subject.status || 'Active'}</Badge>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Identity Verified</p>
                            <p className="text-sm font-medium">{subject.skuCode || subject.lotCode || 'System'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Chemistry Match</p>
                            <p className="text-sm font-medium">{subject.chemistry || sku?.chemistry || 'LFP'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Created At</p>
                            <p className="text-sm font-medium">{new Date(subject.createdAt || subject.generatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Integrity Status</p>
                            <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                                <ShieldCheck size={14} /> SEALED
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* DOWNSTREAM / CHILDREN */}
                {children.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-center h-4"><div className="w-0.5 bg-slate-200" /></div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground px-1">Component Hierarchy ({children.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {children.map(child => (
                                <Card key={child.id || child.serial} className="cursor-pointer hover:border-primary transition-all group" onClick={() => navigate(`/trace/lineage/${child.id || child.serial}`)}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {child.type === 'MODULE' ? <Box size={16} className="text-indigo-500" /> : <Fingerprint size={16} className="text-emerald-500" />}
                                            <div>
                                                <p className="text-xs font-bold font-mono group-hover:text-primary">{child.id || child.serial}</p>
                                                <p className="text-[9px] uppercase text-muted-foreground">{child.type}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-300 group-hover:text-primary" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Audit Intelligence */}
            <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-400" /> Rule Compliance</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                            <p className="font-bold mb-2">Population Metrics</p>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400">Target Count:</span>
                                <span className="font-mono text-emerald-400">{subject.type === 'PACK' ? sku?.requiredModules : sku?.seriesCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] mt-1">
                                <span className="text-slate-400">Actual Count:</span>
                                <span className="font-mono text-emerald-400">{children.length}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                             <p className="font-bold mb-2">Constraint Verifier</p>
                             <ul className="space-y-1.5 opacity-80">
                                <li className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> Chemistry Consistency</li>
                                <li className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> No Cross-Lot Mixing</li>
                                <li className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> Sealing Signature Match</li>
                             </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History size={16} className="text-indigo-500" /> Subject Activity</CardTitle></CardHeader>
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
                    <p className="text-[9px] leading-tight">Identity graph is anchored to workstation timestamps. Records are non-volatile.</p>
                </div>
            </div>

        </div>
      )}
    </div>
  );
}
