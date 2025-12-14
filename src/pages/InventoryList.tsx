import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/api';
import { Battery, InventoryStatus } from '../domain/types';
import { Button, Input, Table, TableHeader, TableRow, TableHead, TableCell, Badge, Card, CardContent, Tooltip } from '../components/ui/design-system';
import { Search, Filter, Eye, Box, ArrowRightLeft, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';

// --- Types & Helpers ---

const getStatusVariant = (status?: InventoryStatus) => {
  switch (status) {
    case InventoryStatus.AVAILABLE: return 'success';
    case InventoryStatus.RESERVED: return 'warning';
    case InventoryStatus.QUARANTINED: return 'destructive';
    case InventoryStatus.PENDING_PUTAWAY: return 'secondary';
    default: return 'outline';
  }
};

const calculateAging = (enteredAt?: string) => {
    if (!enteredAt) return '-';
    const days = Math.floor((Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60 * 24));
    return `${days}d`;
};

// --- Modals ---

const LocationModal = ({ isOpen, title, onClose, onConfirm, loading }: any) => {
    const [loc, setLoc] = useState({ wh: 'WH1', zone: '', rack: '', bin: '' });
    
    if (!isOpen) return null;
    
    const handleSubmit = () => {
        const fullLoc = `${loc.wh}-${loc.zone}-${loc.rack}-${loc.bin}`;
        onConfirm(fullLoc);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[400px] shadow-xl border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Warehouse</label>
                        <select className="w-full p-2 border rounded text-sm bg-background" value={loc.wh} onChange={e => setLoc({...loc, wh: e.target.value})}>
                            <option value="WH1">Main Warehouse (WH1)</option>
                            <option value="WH2">Overflow (WH2)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Zone</label>
                        <Input value={loc.zone} onChange={e => setLoc({...loc, zone: e.target.value.toUpperCase()})} placeholder="Z1" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Rack</label>
                        <Input value={loc.rack} onChange={e => setLoc({...loc, rack: e.target.value.toUpperCase()})} placeholder="R01" />
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-medium">Bin</label>
                        <Input value={loc.bin} onChange={e => setLoc({...loc, bin: e.target.value.toUpperCase()})} placeholder="B01" />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!loc.zone || !loc.rack || !loc.bin || loading} onClick={handleSubmit}>{loading ? 'Saving...' : 'Confirm'}</Button>
                </div>
            </div>
        </div>
    );
};

const QuarantineModal = ({ isOpen, onClose, onConfirm, loading }: any) => {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-[400px] shadow-xl border dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4 text-rose-600">Quarantine Battery</h3>
                <div className="space-y-4 mb-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Reason Code</label>
                        <select className="w-full p-2 border rounded text-sm bg-background" value={reason} onChange={e => setReason(e.target.value)}>
                            <option value="">Select Reason...</option>
                            <option value="DAMAGED">Physical Damage</option>
                            <option value="AUDIT_FAIL">Audit Failure</option>
                            <option value="HOLD_REQUEST">Hold Request</option>
                            <option value="RECALL">Recall</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Notes</label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details..." />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!reason || !notes || loading} variant="destructive" onClick={() => onConfirm(reason, notes)}>{loading ? 'Processing...' : 'Quarantine'}</Button>
                </div>
            </div>
        </div>
    );
};


// --- Main Page ---

export default function InventoryList() {
    const navigate = useNavigate();
    const { currentCluster, currentRole, addNotification } = useAppStore();
    const [items, setItems] = useState<Battery[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [search, setSearch] = useState('');

    // Modal State
    const [activeBattery, setActiveBattery] = useState<Battery | null>(null);
    const [modalType, setModalType] = useState<'putaway' | 'move' | 'quarantine' | null>(null);
    const [processing, setProcessing] = useState(false);

    // RBAC
    const canManageInventory = canDo(currentCluster?.id || '', ScreenId.INVENTORY, 'E'); // C6 + Super
    const canQuarantine = canDo(currentCluster?.id || '', ScreenId.INVENTORY, 'E') && (currentCluster?.id === 'C3' || currentCluster?.id === 'CS'); // C3 + Super
    // Actually C6 policy is full access, C3 is partial. Let's rely on specific checks.
    const isLogistics = currentCluster?.id === 'C6' || currentCluster?.id === 'CS';
    const isQA = currentCluster?.id === 'C3' || currentCluster?.id === 'CS';

    useEffect(() => {
        loadInventory();
    }, [statusFilter]);

    const loadInventory = async () => {
        setLoading(true);
        const data = await inventoryService.getInventory({ status: statusFilter === 'All' ? undefined : statusFilter });
        setItems(data);
        setLoading(false);
    };

    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    const handlePutAway = async (loc: string) => {
        if (!activeBattery) return;
        setProcessing(true);
        try {
            await inventoryService.putAwayBattery(activeBattery.id, loc, userLabel);
            addNotification({ title: "Success", message: "Battery put away", type: "success" });
            loadInventory();
        } catch (e) {
            addNotification({ title: "Error", message: "Put away failed", type: "error" });
        } finally {
            setProcessing(false);
            setModalType(null);
        }
    };

    const handleMove = async (loc: string) => {
        if (!activeBattery) return;
        setProcessing(true);
        try {
            await inventoryService.moveBattery(activeBattery.id, loc, userLabel);
            addNotification({ title: "Success", message: "Battery moved", type: "success" });
            loadInventory();
        } catch (e) {
            addNotification({ title: "Error", message: "Move failed", type: "error" });
        } finally {
            setProcessing(false);
            setModalType(null);
        }
    };

    const handleReserve = async (batt: Battery) => {
        if (!window.confirm(`Reserve ${batt.serialNumber} for dispatch?`)) return;
        try {
            await inventoryService.reserveBattery(batt.id, userLabel);
            addNotification({ title: "Reserved", message: "Battery reserved for dispatch", type: "success" });
            loadInventory();
        } catch (e) {
             addNotification({ title: "Error", message: "Reservation failed", type: "error" });
        }
    };

    const handleQuarantine = async (reason: string, notes: string) => {
        if (!activeBattery) return;
        setProcessing(true);
        try {
            await inventoryService.quarantineBattery(activeBattery.id, reason, notes, userLabel);
            addNotification({ title: "Quarantined", message: "Battery moved to quarantine status", type: "warning" });
            loadInventory();
        } catch (e) {
             addNotification({ title: "Error", message: "Quarantine failed", type: "error" });
        } finally {
            setProcessing(false);
            setModalType(null);
        }
    };

    const handleRelease = async (batt: Battery) => {
        if (!window.confirm(`Release ${batt.serialNumber} from quarantine?`)) return;
        try {
            await inventoryService.releaseQuarantine(batt.id, userLabel);
            addNotification({ title: "Released", message: "Battery available for use", type: "success" });
            loadInventory();
        } catch (e) {
             addNotification({ title: "Error", message: "Release failed", type: "error" });
        }
    };

    const filteredItems = items.filter(i => 
        i.serialNumber.toLowerCase().includes(search.toLowerCase()) || 
        i.batchId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finished Goods Inventory</h2>
                    <p className="text-muted-foreground">Manage storage, movement, and availability of certified packs.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by SN or Batch..." 
                                className="pl-9" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select 
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                {Object.values(InventoryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Aging</TableHead>
                                <TableHead>Last Move</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
                                </TableRow>
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No inventory records found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map(item => (
                                    <TableRow key={item.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(`/batteries/${item.id}`)}>
                                        <TableCell className="font-mono font-medium">{item.serialNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(item.inventoryStatus)}>{item.inventoryStatus}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{item.inventoryLocation || '-'}</TableCell>
                                        <TableCell>{calculateAging(item.inventoryEnteredAt)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {item.inventoryMovementLog?.[item.inventoryMovementLog.length - 1]?.timestamp 
                                                ? new Date(item.inventoryMovementLog[item.inventoryMovementLog.length - 1].timestamp).toLocaleString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                                                <Tooltip content="View Detail">
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/batteries/${item.id}`)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Tooltip>

                                                {/* Put Away (Logistics) */}
                                                {isLogistics && item.inventoryStatus === InventoryStatus.PENDING_PUTAWAY && (
                                                    <Tooltip content="Put Away">
                                                        <Button variant="ghost" size="icon" onClick={() => { setActiveBattery(item); setModalType('putaway'); }}>
                                                            <Box className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    </Tooltip>
                                                )}

                                                {/* Move (Logistics) */}
                                                {isLogistics && item.inventoryStatus === InventoryStatus.AVAILABLE && (
                                                     <Tooltip content="Move Location">
                                                        <Button variant="ghost" size="icon" onClick={() => { setActiveBattery(item); setModalType('move'); }}>
                                                            <ArrowRightLeft className="h-4 w-4 text-slate-600" />
                                                        </Button>
                                                    </Tooltip>
                                                )}

                                                {/* Reserve (Logistics) */}
                                                {isLogistics && item.inventoryStatus === InventoryStatus.AVAILABLE && (
                                                     <Tooltip content="Reserve for Dispatch">
                                                        <Button variant="ghost" size="icon" onClick={() => handleReserve(item)}>
                                                            <Lock className="h-4 w-4 text-amber-600" />
                                                        </Button>
                                                    </Tooltip>
                                                )}

                                                {/* Quarantine (QA) */}
                                                {isQA && item.inventoryStatus !== InventoryStatus.QUARANTINED && (
                                                    <Tooltip content="Quarantine">
                                                        <Button variant="ghost" size="icon" onClick={() => { setActiveBattery(item); setModalType('quarantine'); }}>
                                                            <ShieldAlert className="h-4 w-4 text-rose-600" />
                                                        </Button>
                                                    </Tooltip>
                                                )}

                                                {/* Release (QA) */}
                                                {isQA && item.inventoryStatus === InventoryStatus.QUARANTINED && (
                                                    <Tooltip content="Release from Quarantine">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRelease(item)}>
                                                            <Unlock className="h-4 w-4 text-emerald-600" />
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </tbody>
                    </Table>
                </CardContent>
            </Card>

            <LocationModal 
                isOpen={modalType === 'putaway' || modalType === 'move'} 
                title={modalType === 'putaway' ? "Put Away Battery" : "Move Battery"}
                loading={processing}
                onClose={() => setModalType(null)}
                onConfirm={modalType === 'putaway' ? handlePutAway : handleMove}
            />

            <QuarantineModal 
                isOpen={modalType === 'quarantine'}
                loading={processing}
                onClose={() => setModalType(null)}
                onConfirm={handleQuarantine}
            />
        </div>
    );
}