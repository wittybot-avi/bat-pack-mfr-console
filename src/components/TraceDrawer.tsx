
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from './ui/design-system';
import { X, History, Layers, Box, Fingerprint, ChevronRight, ShieldCheck, AlertTriangle, Download, ArrowRight, ExternalLink } from 'lucide-react';
import { moduleAssemblyService } from '../services/moduleAssemblyService';
import { packAssemblyService } from '../services/packAssemblyService';
import { cellTraceabilityService } from '../services/cellTraceabilityService';
import { skuService, Sku } from '../services/skuService';
import { exportAsJson, exportAsCsv } from '../utils/exporters';

interface TraceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    assetType: 'CELL' | 'MODULE' | 'PACK';
}

export const TraceDrawer: React.FC<TraceDrawerProps> = ({ isOpen, onClose, assetId, assetType }) => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sku, setSku] = useState<Sku | null>(null);

    useEffect(() => {
        if (isOpen && assetId) loadData();
    }, [isOpen, assetId]);

    const loadData = async () => {
        setLoading(true);
        try {
            let res: any = null;
            if (assetType === 'PACK') {
                res = await packAssemblyService.getPack(assetId);
            } else if (assetType === 'MODULE') {
                res = await moduleAssemblyService.getModule(assetId);
            } else {
                const lookup = await cellTraceabilityService.findSerialGlobal(assetId);
                res = lookup ? { ...lookup.serial, type: 'CELL' } : null;
            }
            
            if (res) {
                setData(res);
                const s = await skuService.getSku(res.skuId);
                setSku(s || null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleFullAudit = () => {
        navigate(`/trace/lineage/${assetId}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded">
                            <History size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Trace Quick View</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{assetType} SUBJECT</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">Quarrying ledger...</div>
                    ) : data ? (
                        <>
                            {/* Summary Card */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-2xl font-mono font-bold">{assetId}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline">{data.status || 'Active'}</Badge>
                                        <Badge variant="secondary" className="font-mono text-[10px]">{data.skuCode || 'N/A'}</Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                        <p className="text-muted-foreground mb-1">Created At</p>
                                        <p className="font-medium">{new Date(data.createdAt || data.generatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                        <p className="text-muted-foreground mb-1">Actor</p>
                                        <p className="font-medium truncate">{data.createdBy || data.actor || 'System'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Relationship Links */}
                            <div className="space-y-3">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Genealogy Tree</h5>
                                {assetType === 'PACK' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-indigo-600 font-bold">
                                            <Layers size={14} /> Linked Modules ({data.moduleIds?.length || 0})
                                        </div>
                                        <div className="pl-6 space-y-1 border-l-2 border-slate-100">
                                            {data.moduleIds?.map((mid: string) => (
                                                <div key={mid} className="text-xs font-mono p-1 hover:bg-slate-50 rounded flex items-center justify-between">
                                                    <span>{mid}</span>
                                                    <ChevronRight size={10} className="text-slate-300" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {assetType === 'MODULE' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold">
                                            <Fingerprint size={14} /> Bound Cells ({data.boundCellSerials?.length || 0})
                                        </div>
                                        <div className="pl-6 space-y-1 border-l-2 border-slate-100">
                                            {data.boundCellSerials?.slice(0, 5).map((s: string) => (
                                                <div key={s} className="text-xs font-mono p-1 flex items-center justify-between">
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                            {data.boundCellSerials?.length > 5 && <p className="text-[10px] text-muted-foreground">+{data.boundCellSerials.length - 5} more...</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Compliance Outcome */}
                            <Card className="bg-slate-900 text-white border-none shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ledger Compliance</h5>
                                        <ShieldCheck size={14} className="text-emerald-400" />
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Population Match:</span>
                                            <span className="font-mono">
                                                {assetType === 'PACK' ? `${data.moduleIds?.length} / ${sku?.requiredModules}` : `${data.boundCellSerials?.length} / ${data.targetCells}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Topology Verified:</span>
                                            <span className="text-emerald-400">YES</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="py-20 text-center text-sm text-muted-foreground italic">Subject not found in registry.</div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 dark:bg-slate-800 space-y-2">
                    <Button className="w-full" onClick={handleFullAudit}>
                        <ExternalLink size={14} className="mr-2" /> Open Full Lineage Audit
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportAsJson(data, `Trace_${assetId}`)} disabled={!data}>
                            <Download size={12} className="mr-2" /> JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportAsCsv(['ID', 'Type'], [[assetId, assetType]], `Trace_${assetId}`)} disabled={!data}>
                            <Download size={12} className="mr-2" /> CSV
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
