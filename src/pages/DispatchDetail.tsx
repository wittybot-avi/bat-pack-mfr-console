
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dispatchService, inventoryService, batteryService } from '../services/api';
import { eolQaService } from '../services/eolQaService';
import { DispatchOrder, DispatchStatus, Battery, InventoryStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Input, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, Truck, Plus, FileText, CheckCircle, Trash2, Printer, Send, Loader2, AlertTriangle, Search } from 'lucide-react';

const BatteryPickerModal = ({ isOpen, onClose, onAdd, alreadySelectedIds }: any) => {
    const [available, setAvailable] = useState<Battery[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            Promise.all([
                inventoryService.getInventory(),
                eolQaService.getDispatchEligiblePacks()
            ]).then(([inventoryData, eligiblePacks]) => {
                const eligibleIds = new Set(eligiblePacks.map(p => p.id));
                const valid = inventoryData.filter(b => 
                    !alreadySelectedIds.includes(b.id) && 
                    (b.inventoryStatus === InventoryStatus.AVAILABLE) &&
                    (eligibleIds.has(b.id) || b.eolResult === 'PASS')
                );
                setAvailable(valid);
                setLoading(false);
            });
        } else {
            setSelected([]);
            setSearchTerm('');
        }
    }, [isOpen, alreadySelectedIds]);

    if (!isOpen) return null;

    const filtered = available.filter(b => 
        b.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Add Packs to Dispatch</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by SN..." 
                            className="pl-9 h-9" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 opacity-20" /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No eligible batteries available for dispatch.</TableCell></TableRow>
                            ) : (
                                filtered.map(b => (
                                    <TableRow key={b.id} className="cursor-pointer" onClick={() => toggleSelect(b.id)}>
                                        <TableCell>
                                            <input type="checkbox" checked={selected.includes(b.id)} readOnly className="rounded border-slate-300" />
                                        </TableCell>
                                        <TableCell className="font-mono font-bold">{b.serialNumber}</TableCell>
                                        <TableCell className="text-xs">{b.batchId}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px]">{b.inventoryStatus}</Badge></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </tbody>
                    </Table>
                </CardContent>
                <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onAdd(selected)} disabled={selected.length === 0}>
                        Add {selected.length} Selected
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export function DispatchDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { currentRole, currentCluster, addNotification } = useAppStore();
    
    const [order, setOrder] = useState<DispatchOrder | null>(null);
    const [batteries, setBatteries] = useState<Battery[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const isSuperAdmin = currentCluster?.id === 'CS';
    const isLogistics = currentCluster?.id === 'C6' || isSuperAdmin;
    const canManageOrder = isLogistics && order?.status !== DispatchStatus.DISPATCHED;

    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    useEffect(() => {
        if (orderId) loadData();
    }, [orderId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await dispatchService.getOrderById(orderId!);
            if (data) {
                setOrder(data);
                const batts = await Promise.all(data.batteryIds.map(id => batteryService.getBatteryById(id)));
                setBatteries(batts.filter(b => !!b) as Battery[]);
            }
        } catch (e) {
            addNotification({ title: 'Error', message: 'Failed to load order.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddBatteries = async (ids: string[]) => {
        if (!order) return;
        setProcessing(true);
        try {
            await dispatchService.addBatteries(order.id, ids, userLabel);
            addNotification({ title: 'Added', message: `${ids.length} batteries added to order.`, type: 'success' });
            setIsPickerOpen(false);
            await loadData();
        } catch (e: any) {
            addNotification({ title: 'Error', message: e.message, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleRemoveBattery = async (id: string) => {
        if (!order || !window.confirm("Remove this unit from the order?")) return;
        setProcessing(true);
        try {
            await dispatchService.removeBattery(order.id, id, userLabel);
            addNotification({ title: 'Removed', message: 'Battery removed from order.', type: 'info' });
            await loadData();
        } catch (e: any) {
            addNotification({ title: 'Error', message: e.message, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleGenerateDoc = async (type: 'packing' | 'manifest' | 'invoice') => {
        if (!order) return;
        setProcessing(true);
        try {
            await dispatchService.generateDocument(order.id, type, userLabel);
            addNotification({ title: 'Document Generated', message: `${type.replace(/^\w/, c => c.toUpperCase())} ready.`, type: 'success' });
            await loadData();
        } finally {
            setProcessing(false);
        }
    };

    const handleDispatch = async () => {
        if (!order || !window.confirm("Confirm final dispatch? All units will be marked In-Transit.")) return;
        setProcessing(true);
        try {
            await dispatchService.markDispatched(order.id, userLabel);
            addNotification({ title: 'Dispatched', message: 'Order sent. Inventory levels adjusted.', type: 'success' });
            await loadData();
        } catch (e: any) {
            addNotification({ title: 'Dispatch Failed', message: e.message, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing logistics ledger...</div>;
    if (!order) return <div className="p-20 text-center">Order not found.</div>;

    const isDispatched = order.status === DispatchStatus.DISPATCHED;
    const readyForDispatch = order.batteryIds.length > 0 && order.packingListRef && order.status !== DispatchStatus.DISPATCHED;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dispatch')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold font-mono">{order.orderNumber}</h2>
                            <Badge variant={isDispatched ? 'success' : 'default'}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {readyForDispatch && isLogistics && (
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleDispatch} disabled={processing}>
                            <Send className="mr-2 h-4 w-4" /> Confirm Dispatch
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Logistics Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">Destination</p>
                                <p className="font-medium">{order.destinationAddress}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">Est. Ship Date</p>
                                <p className="font-medium">{order.expectedShipDate}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">Carrier</p>
                                <p className="font-medium">{order.carrierName || 'TBD'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground uppercase text-[10px] font-bold">Creator</p>
                                <p className="font-medium">{order.createdBy}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base flex items-center gap-2"><Truck className="h-5 w-5" /> Shipment Contents</CardTitle>
                            {canManageOrder && (
                                <Button size="sm" variant="outline" onClick={() => setIsPickerOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Packs
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Batch</TableHead>
                                        <TableHead>QA Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <tbody>
                                    {batteries.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">No batteries added to this shipment yet.</TableCell></TableRow>
                                    ) : (
                                        batteries.map(b => (
                                            <TableRow key={b.id}>
                                                <TableCell className="font-mono font-bold text-primary">{b.serialNumber}</TableCell>
                                                <TableCell className="text-xs">{b.batchId}</TableCell>
                                                <TableCell>
                                                    <Badge variant="success" className="text-[10px]">CERTIFIED</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {canManageOrder && (
                                                        <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => handleRemoveBattery(b.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Shipping Documents</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <div>
                                        <p className="text-xs font-bold">Packing List</p>
                                        <p className="text-[10px] text-muted-foreground">{order.packingListRef || 'Missing'}</p>
                                    </div>
                                </div>
                                {order.packingListRef ? (
                                    <Button variant="ghost" size="icon"><Printer size={14} /></Button>
                                ) : (
                                    <Button variant="outline" className="h-7 text-[10px] px-2" onClick={() => handleGenerateDoc('packing')} disabled={!canManageOrder || batteries.length === 0}>Generate</Button>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-indigo-500" />
                                    <div>
                                        <p className="text-xs font-bold">Shipping Manifest</p>
                                        <p className="text-[10px] text-muted-foreground">{order.manifestRef || 'Missing'}</p>
                                    </div>
                                </div>
                                {order.manifestRef ? (
                                    <Button variant="ghost" size="icon"><Printer size={14} /></Button>
                                ) : (
                                    <Button variant="outline" className="h-7 text-[10px] px-2" onClick={() => handleGenerateDoc('manifest')} disabled={!canManageOrder || batteries.length === 0}>Generate</Button>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-emerald-500" />
                                    <div>
                                        <p className="text-xs font-bold">Commercial Invoice</p>
                                        <p className="text-[10px] text-muted-foreground">{order.invoiceRef || 'Missing'}</p>
                                    </div>
                                </div>
                                {order.invoiceRef ? (
                                    <Button variant="ghost" size="icon"><Printer size={14} /></Button>
                                ) : (
                                    <Button variant="outline" className="h-7 text-[10px] px-2" onClick={() => handleGenerateDoc('invoice')} disabled={!canManageOrder || batteries.length === 0}>Generate</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {isDispatched && (
                        <div className="p-4 border-2 border-emerald-100 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Order Dispatched</p>
                                <p className="text-xs text-emerald-700/80 dark:text-emerald-500">Inventory levels adjusted and custody transfer logs initialized.</p>
                            </div>
                        </div>
                    )}

                    {!isDispatched && !readyForDispatch && batteries.length > 0 && (
                        <div className="p-4 border-2 border-dashed border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-tight">
                                Documents Required: Generate Packing List to unlock final dispatch.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <BatteryPickerModal 
                isOpen={isPickerOpen} 
                onClose={() => setIsPickerOpen(false)} 
                onAdd={handleAddBatteries} 
                alreadySelectedIds={order.batteryIds}
            />
        </div>
    );
}

export default DispatchDetail;
