import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dispatchService, inventoryService, batteryService } from '../services/api';
import { DispatchOrder, DispatchStatus, Battery, InventoryStatus } from '../domain/types';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Input, Tooltip } from '../components/ui/design-system';
import { ArrowLeft, Truck, FileText, Package, AlertTriangle, CheckCircle, XCircle, Plus, Trash2, Download, Save } from 'lucide-react';

// --- Battery Picker Modal ---

const BatteryPickerModal = ({ isOpen, onClose, onAdd, alreadySelectedIds }: any) => {
    const [available, setAvailable] = useState<Battery[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            // Fetch inventory: AVAILABLE or RESERVED. 
            // In reality, specific RESERVED for this order would be ideal, but for now we list all valid candidates.
            inventoryService.getInventory().then(data => {
                // Filter out already selected in this order
                const valid = data.filter(b => !alreadySelectedIds.includes(b.id) && 
                    (b.inventoryStatus === InventoryStatus.AVAILABLE || b.inventoryStatus === InventoryStatus.RESERVED));
                setAvailable(valid);
                setLoading(false);
            });
        } else {
            setSelected([]);
        }
    }, [isOpen, alreadySelectedIds]);

    const toggleSelect = (id: string) => {
        if (selected.includes(id)) setSelected(selected.filter(s => s !== id));
        else setSelected([...selected, id]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[800px] h-[600px] flex flex-col shadow-xl border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">Pick Batteries from Inventory</h3>
                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Batch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading inventory...</TableCell></TableRow>
                            ) : available.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10">No eligible batteries found.</TableCell></TableRow>
                            ) : (
                                available.map(b => (
                                    <TableRow key={b.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => toggleSelect(b.id)}>
                                        <TableCell>
                                            <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggleSelect(b.id)} />
                                        </TableCell>
                                        <TableCell className="font-mono">{b.serialNumber}</TableCell>
                                        <TableCell>{b.inventoryLocation}</TableCell>
                                        <TableCell><Badge variant="outline">{b.inventoryStatus}</Badge></TableCell>
                                        <TableCell className="text-xs">{b.batchId}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
                <div className="pt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{selected.length} selected</span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button disabled={selected.length === 0} onClick={() => { onAdd(selected); onClose(); }}>Add Selected</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

export default function DispatchDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentCluster, currentRole, addNotification } = useAppStore();
    
    const [order, setOrder] = useState<DispatchOrder | null>(null);
    const [batteries, setBatteries] = useState<Battery[]>([]); // Details of batteries in order
    const [loading, setLoading] = useState(true);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Header edit state
    const [editForm, setEditForm] = useState<Partial<DispatchOrder>>({});

    // Permissions
    const canEdit = canDo(currentCluster?.id || '', ScreenId.DISPATCH_DETAIL, 'E');
    const canExecute = canDo(currentCluster?.id || '', ScreenId.DISPATCH_DETAIL, 'X');
    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    useEffect(() => {
        if (id) loadData(id);
    }, [id]);

    const loadData = async (orderId: string) => {
        setLoading(true);
        const data = await dispatchService.getOrderById(orderId);
        if (!data) {
            addNotification({ title: "Error", message: "Order not found", type: "error" });
            navigate('/dispatch');
            return;
        }
        setOrder(data);
        setEditForm(data); // Init form
        
        // Fetch battery details
        const battDetails = await Promise.all(data.batteryIds.map(bid => batteryService.getBatteryById(bid)));
        setBatteries(battDetails.filter(b => !!b) as Battery[]);
        
        setLoading(false);
    };

    const handleUpdateHeader = async () => {
        if (!order) return;
        setProcessing(true);
        try {
            const updated = await dispatchService.updateOrder(order.id, editForm, userLabel);
            setOrder(updated);
            setIsEditing(false);
            addNotification({ title: "Saved", message: "Order updated", type: "success" });
        } catch (e) {
            addNotification({ title: "Error", message: "Update failed", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    const handleAddBatteries = async (ids: string[]) => {
        if (!order) return;
        setProcessing(true);
        try {
            await dispatchService.addBatteries(order.id, ids, userLabel);
            addNotification({ title: "Added", message: `${ids.length} batteries added`, type: "success" });
            loadData(order.id);
        } catch (e) {
            addNotification({ title: "Error", message: "Failed to add batteries", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    const handleRemoveBattery = async (battId: string) => {
        if (!order) return;
        try {
            await dispatchService.removeBattery(order.id, battId, userLabel);
            loadData(order.id);
        } catch (e) {
            addNotification({ title: "Error", message: "Failed to remove battery", type: "error" });
        }
    };

    const handleGenerateDoc = async (type: 'packing' | 'manifest' | 'invoice') => {
        if (!order) return;
        setProcessing(true);
        try {
            const updated = await dispatchService.generateDocument(order.id, type, userLabel);
            setOrder(updated);
            addNotification({ title: "Generated", message: `${type} document created`, type: "success" });
        } catch (e) {
            addNotification({ title: "Error", message: "Generation failed", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    const handleStatusChange = async (action: 'ready' | 'dispatch' | 'cancel') => {
        if (!order) return;
        if (!window.confirm(`Confirm action: ${action.toUpperCase()}?`)) return;
        
        setProcessing(true);
        try {
            if (action === 'ready') await dispatchService.markReady(order.id, userLabel);
            if (action === 'dispatch') await dispatchService.markDispatched(order.id, userLabel);
            if (action === 'cancel') await dispatchService.cancelOrder(order.id, userLabel);
            
            addNotification({ title: "Success", message: `Order marked as ${action.toUpperCase()}`, type: "success" });
            loadData(order.id);
        } catch (e: any) {
            addNotification({ title: "Error", message: e.message, type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    if (loading || !order) return <div className="p-10 text-center">Loading...</div>;

    const isEditable = (order.status === DispatchStatus.DRAFT || order.status === DispatchStatus.READY) && canEdit;
    const isActionable = canExecute;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dispatch')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold">{order.orderNumber}</h2>
                            <Badge variant={order.status === DispatchStatus.DISPATCHED ? 'success' : 'outline'}>{order.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">Created by {order.createdBy} on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Details Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Shipment Details</CardTitle>
                        {isEditable && !isEditing && <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>}
                        {isEditing && (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleUpdateHeader} disabled={processing}><Save className="h-4 w-4 mr-1" /> Save</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Customer</label>
                            {isEditing ? <Input value={editForm.customerName} onChange={e => setEditForm({...editForm, customerName: e.target.value})} /> : <div className="font-medium">{order.customerName}</div>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Destination</label>
                            {isEditing ? <Input value={editForm.destinationAddress} onChange={e => setEditForm({...editForm, destinationAddress: e.target.value})} /> : <div className="font-medium">{order.destinationAddress}</div>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Carrier</label>
                            {isEditing ? <Input value={editForm.carrierName || ''} onChange={e => setEditForm({...editForm, carrierName: e.target.value})} placeholder="Carrier Name" /> : <div className="font-medium">{order.carrierName || '-'}</div>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Expected Ship Date</label>
                            {isEditing ? <Input type="date" value={editForm.expectedShipDate} onChange={e => setEditForm({...editForm, expectedShipDate: e.target.value})} /> : <div className="font-medium">{order.expectedShipDate}</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Battery List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg">Manifest Items ({batteries.length})</CardTitle>
                        {isEditable && <Button size="sm" onClick={() => setIsPickerOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Batteries</Button>}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Serial Number</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <tbody>
                                {batteries.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No items added yet.</TableCell></TableRow>
                                ) : (
                                    batteries.map(b => (
                                        <TableRow key={b.id}>
                                            <TableCell className="font-mono">{b.serialNumber}</TableCell>
                                            <TableCell>{b.location}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-[10px]">{b.inventoryStatus || b.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                {isEditable && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveBattery(b.id)} className="text-rose-500 hover:text-rose-700">
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

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 space-y-4 shrink-0">
                {/* Workflow Actions */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Order Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {order.status === DispatchStatus.DRAFT && (
                            <Button className="w-full" onClick={() => handleStatusChange('ready')} disabled={!isActionable || batteries.length === 0 || processing}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark Ready
                            </Button>
                        )}
                        {order.status === DispatchStatus.READY && (
                            <Button className="w-full" onClick={() => handleStatusChange('dispatch')} disabled={!isActionable || !order.packingListRef || processing}>
                                <Truck className="mr-2 h-4 w-4" /> Dispatch Shipment
                            </Button>
                        )}
                        {order.status !== DispatchStatus.DISPATCHED && order.status !== DispatchStatus.CANCELLED && (
                            <Button variant="outline" className="w-full text-rose-600" onClick={() => handleStatusChange('cancel')} disabled={!isActionable || processing}>
                                <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                            </Button>
                        )}
                        
                        {order.status === DispatchStatus.DISPATCHED && (
                            <div className="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-sm flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" /> Dispatched on {new Date(order.dispatchedAt || '').toLocaleDateString()}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Documentation</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm font-medium">Packing List</span>
                            {order.packingListRef ? (
                                <Button variant="ghost" size="icon" className="text-blue-600"><Download className="h-4 w-4" /></Button>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => handleGenerateDoc('packing')} disabled={!isActionable || processing}>Gen</Button>
                            )}
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm font-medium">Manifest</span>
                            {order.manifestRef ? (
                                <Button variant="ghost" size="icon" className="text-blue-600"><Download className="h-4 w-4" /></Button>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => handleGenerateDoc('manifest')} disabled={!isActionable || processing}>Gen</Button>
                            )}
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm font-medium">Commercial Invoice</span>
                            {order.invoiceRef ? (
                                <Button variant="ghost" size="icon" className="text-blue-600"><Download className="h-4 w-4" /></Button>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => handleGenerateDoc('invoice')} disabled={!isActionable || processing}>Gen</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
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