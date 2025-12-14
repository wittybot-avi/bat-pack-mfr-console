import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { batteryService, provisioningService } from '../services/api';
import { Battery } from '../domain/types';
import { canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Tooltip } from '../components/ui/design-system';
import { Cpu, Scan, CheckCircle, AlertTriangle, Play, Shield, RefreshCw, Save, ArrowRight } from 'lucide-react';

const STEP_TITLES = [
    "Scan Battery",
    "Bind BMS",
    "Firmware",
    "Calibration",
    "Security",
    "Verify",
    "Finalize"
];

export default function ProvisioningConsole() {
    const { currentCluster, currentRole, addNotification } = useAppStore();
    const canExecute = canDo(currentCluster?.id || '', ScreenId.PROVISIONING, 'X');

    const [stationId, setStationId] = useState(() => localStorage.getItem('provisioning_station_id') || 'P-01');
    const [currentStep, setCurrentStep] = useState(0);
    const [battery, setBattery] = useState<Battery | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Inputs
    const [scanInput, setScanInput] = useState('');
    const [bmsUid, setBmsUid] = useState('');
    const [firmware, setFirmware] = useState('v2.4.0');
    const [profile, setProfile] = useState('CAL_LFP_16S_v3.2');
    const [failNotes, setFailNotes] = useState('');
    
    // Verification Results
    const [verification, setVerification] = useState<{ handshake: boolean, telemetry: boolean } | null>(null);

    const userLabel = `${currentRole?.name} (${currentCluster?.id})`;

    const handleScan = async () => {
        if (!scanInput) return;
        setLoading(true);
        try {
            // Mock: find by SN or ID. Since API mocks ID mostly, let's try to fetch by ID first, or simulated SN lookup
            // For demo, we just use getBatteryById logic but assume input is SN for UX
            // In mock service, getBatteryBySN is implemented
            const batt = await batteryService.getBatteryBySN(scanInput) || await batteryService.getBatteryById(scanInput);
            
            if (batt) {
                setBattery(batt);
                setCurrentStep(1);
                // Pre-fill if already exists
                setBmsUid(batt.bmsUid || '');
                if (batt.firmwareVersion) setFirmware(batt.firmwareVersion);
                if (batt.calibrationProfile) setProfile(batt.calibrationProfile);
            } else {
                addNotification({ title: "Not Found", message: "Battery not found in system", type: "error" });
            }
        } catch (e) {
            addNotification({ title: "Error", message: "Scan failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleBindBms = async () => {
        if (!battery || !bmsUid) return;
        setLoading(true);
        try {
            const updated = await provisioningService.bindBms(battery.id, bmsUid, userLabel);
            setBattery(updated);
            setCurrentStep(2);
            addNotification({ title: "Success", message: "BMS Bound", type: "success" });
        } catch (e) {
            addNotification({ title: "Error", message: "Bind failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleFlash = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const updated = await provisioningService.flashFirmware(battery.id, firmware, userLabel);
            setBattery(updated);
            setCurrentStep(3);
            addNotification({ title: "Success", message: "Firmware Flashed", type: "success" });
        } catch (e) {
            addNotification({ title: "Error", message: "Flash failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleCalibrate = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const updated = await provisioningService.triggerCalibration(battery.id, profile, userLabel);
            setBattery(updated);
            setCurrentStep(4);
            addNotification({ title: "Success", message: "Calibration Complete", type: "success" });
        } catch (e) {
            addNotification({ title: "Error", message: "Calibration failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleSecurity = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const updated = await provisioningService.injectSecurity(battery.id, userLabel);
            setBattery(updated);
            setCurrentStep(5);
            addNotification({ title: "Success", message: "Keys Injected", type: "success" });
        } catch (e) {
            addNotification({ title: "Error", message: "Injection failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!battery) return;
        setLoading(true);
        try {
            const res = await provisioningService.runVerification(battery.id);
            setVerification(res);
            addNotification({ title: "Verified", message: "Diagnostics Complete", type: "info" });
            setCurrentStep(6);
        } catch (e) {
            addNotification({ title: "Error", message: "Verification failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (result: 'PASS' | 'FAIL') => {
        if (!battery) return;
        setLoading(true);
        try {
            const updated = await provisioningService.finalizeProvisioning(battery.id, result, userLabel, failNotes);
            setBattery(updated);
            addNotification({ title: result === 'PASS' ? "Provisioned" : "Flagged", message: `Battery marked as ${result}`, type: result === 'PASS' ? 'success' : 'warning' });
            // Reset for next
            setTimeout(() => {
                if (window.confirm("Load next battery?")) {
                    handleReset();
                }
            }, 500);
        } catch (e) {
            addNotification({ title: "Error", message: "Finalization failed", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setBattery(null);
        setCurrentStep(0);
        setScanInput('');
        setBmsUid('');
        setVerification(null);
        setFailNotes('');
    };

    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        <Scan size={64} className="text-muted-foreground animate-pulse" />
                        <div className="w-full max-w-md space-y-4">
                            <Input 
                                autoFocus 
                                placeholder="Scan Battery SN or ID..." 
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                className="text-lg h-12 text-center"
                                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                            />
                            <Button size="lg" className="w-full" onClick={handleScan} disabled={loading || !scanInput}>
                                {loading ? 'Scanning...' : 'Load Battery'}
                            </Button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 max-w-md mx-auto py-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">BMS Hardware UID</label>
                            <div className="flex gap-2">
                                <Input value={bmsUid} onChange={(e) => setBmsUid(e.target.value)} placeholder="Scan or Enter BMS UID" />
                                <Button variant="outline" onClick={() => setBmsUid(`BMS-${Math.floor(Math.random()*10000)}`)}>Read</Button>
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleBindBms} disabled={loading || !bmsUid || !canExecute}>
                            {loading ? 'Binding...' : 'Bind & Proceed'}
                        </Button>
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-6 max-w-md mx-auto py-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Firmware Baseline</label>
                            <select className="w-full p-2 border rounded bg-background" value={firmware} onChange={(e) => setFirmware(e.target.value)}>
                                <option value="v2.4.0">v2.4.0 (Stable)</option>
                                <option value="v2.5.0-rc1">v2.5.0-rc1 (Beta)</option>
                                <option value="v2.3.9">v2.3.9 (Legacy)</option>
                            </select>
                        </div>
                        <Button className="w-full" onClick={handleFlash} disabled={loading || !canExecute}>
                            {loading ? 'Flashing...' : 'Flash Firmware'}
                        </Button>
                    </div>
                );
            case 3:
                 return (
                     <div className="space-y-6 max-w-md mx-auto py-6">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded text-sm text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex gap-2">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p>Calibration is executed by device firmware/tool. Console only triggers and records the applied profile.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Calibration Profile</label>
                            <select className="w-full p-2 border rounded bg-background" value={profile} onChange={(e) => setProfile(e.target.value)}>
                                <option value="CAL_LFP_16S_v3.2">CAL_LFP_16S_v3.2</option>
                                <option value="CAL_NMC_14S_v2.0">CAL_NMC_14S_v2.0</option>
                            </select>
                        </div>
                        <Button className="w-full" onClick={handleCalibrate} disabled={loading || !canExecute}>
                            {loading ? 'Calibrating...' : 'Trigger Calibration'}
                        </Button>
                    </div>
                );
             case 4:
                 return (
                     <div className="space-y-6 max-w-md mx-auto py-6 text-center">
                        <Shield size={48} className="mx-auto text-primary" />
                        <p className="text-muted-foreground">Ready to inject security certificates and lock JTAG ports.</p>
                        <Button size="lg" className="w-full" onClick={handleSecurity} disabled={loading || !canExecute}>
                            {loading ? 'Injecting...' : 'Inject Security Identity'}
                        </Button>
                    </div>
                );
             case 5:
                 return (
                     <div className="space-y-6 max-w-md mx-auto py-6 text-center">
                        <p className="text-muted-foreground">Run final diagnostic checks before releasing.</p>
                        <Button size="lg" className="w-full" onClick={handleVerify} disabled={loading || !canExecute}>
                            {loading ? 'Verifying...' : 'Run Verification'}
                        </Button>
                    </div>
                );
             case 6:
                return (
                    <div className="space-y-6 max-w-lg mx-auto py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded bg-slate-50 dark:bg-slate-800">
                                <span className="text-xs text-muted-foreground block mb-1">Handshake</span>
                                {verification?.handshake ? <Badge variant="success">OK</Badge> : <Badge variant="destructive">FAIL</Badge>}
                            </div>
                            <div className="p-4 border rounded bg-slate-50 dark:bg-slate-800">
                                <span className="text-xs text-muted-foreground block mb-1">Telemetry</span>
                                {verification?.telemetry ? <Badge variant="success">OK</Badge> : <Badge variant="destructive">FAIL</Badge>}
                            </div>
                        </div>
                        
                        {!canExecute ? (
                             <div className="text-center text-red-500 font-bold p-4 border rounded">You do not have permission to finalize.</div>
                        ) : (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex gap-4">
                                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleFinalize('PASS')}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Pass & Release
                                    </Button>
                                    <Button className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={() => handleFinalize('FAIL')}>
                                        <AlertTriangle className="mr-2 h-4 w-4" /> Fail / Rework
                                    </Button>
                                </div>
                                <Input placeholder="Failure notes (required for FAIL)" value={failNotes} onChange={e => setFailNotes(e.target.value)} />
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Station Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary font-bold">
                        {stationId}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Provisioning Station</h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Operator: {userLabel}</span>
                            <span className="text-slate-300">|</span>
                            <span className={battery ? "text-blue-500 font-semibold" : "text-emerald-500 font-semibold"}>
                                {battery ? 'BUSY' : 'READY'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset Station
                     </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Stepper Area */}
                <Card className="flex-1">
                    <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                             <CardTitle>Step {currentStep + 1}: {STEP_TITLES[currentStep]}</CardTitle>
                             <div className="flex gap-1">
                                {STEP_TITLES.map((_, i) => (
                                    <div key={i} className={`h-2 w-8 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                ))}
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {renderStepContent()}
                    </CardContent>
                </Card>

                {/* Context Panel */}
                <Card className="w-full lg:w-80 h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Battery Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {battery ? (
                            <>
                                <div>
                                    <p className="text-xs text-muted-foreground">Serial Number</p>
                                    <p className="font-mono font-bold text-lg">{battery.serialNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Batch ID</p>
                                    <p className="text-sm">{battery.batchId}</p>
                                </div>
                                <div className="border-t pt-2 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>BMS:</span>
                                        <span className={battery.bmsUid ? "font-mono" : "text-slate-400"}>{battery.bmsUid || 'Pending'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Firmware:</span>
                                        <span className={battery.firmwareVersion ? "font-mono" : "text-slate-400"}>{battery.firmwareVersion || 'Pending'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Calib:</span>
                                        <span className={battery.calibrationStatus === 'PASS' ? "text-emerald-500" : "text-slate-400"}>{battery.calibrationStatus || 'Pending'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Security:</span>
                                        <span className={battery.cryptoProvisioned ? "text-emerald-500" : "text-slate-400"}>{battery.cryptoProvisioned ? 'Done' : 'Pending'}</span>
                                    </div>
                                </div>
                                <div className="pt-2">
                                     <Badge className="w-full justify-center" variant="outline">{battery.status}</Badge>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <Scan className="mx-auto mb-2 h-8 w-8 opacity-20" />
                                No battery loaded
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}