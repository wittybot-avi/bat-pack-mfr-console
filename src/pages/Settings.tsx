import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { canView, canDo } from '../rbac/can';
import { ScreenId } from '../rbac/screenIds';
import { generateSettingsSpec } from '../services/settingsSpec';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableHeader, TableRow, TableHead, TableCell, Tooltip } from '../components/ui/design-system';
import { Settings as SettingsIcon, Users, Key, Bell, Webhook, Building, Lock, Download, AlertTriangle, Info, ToggleLeft, ToggleRight, Trash2, RefreshCw, CheckCircle, Monitor } from 'lucide-react';

const DisabledInput = (props: any) => (
    <div className="relative">
        <Input {...props} disabled className="pr-8 bg-slate-50 dark:bg-slate-900 text-slate-500" />
        <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
    </div>
);

const DisabledToggle = ({ label, checked }: { label?: string, checked: boolean }) => (
    <div className="flex items-center gap-2 opacity-60 cursor-not-allowed">
        {checked ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6 text-slate-400" />}
        <span className="text-sm text-muted-foreground">{label}</span>
    </div>
);

const BackendRequiredTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Tooltip content="Action disabled: Backend IAM/Secret Manager integration required.">
        <div className="opacity-60 pointer-events-none">{children}</div>
    </Tooltip>
);

// --- Tabs ---

const ProfileTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
        <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Organization Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Organization Name</label>
                        <DisabledInput defaultValue="Aayatana Technologies Pvt Ltd" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tax ID / GSTIN</label>
                        <DisabledInput defaultValue="29AAACA1234A1Z5" />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-sm font-medium">Registered Address</label>
                        <DisabledInput defaultValue="Unit 42, Tech Park, Electronic City, Bangalore, KA" />
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card className="border-indigo-100 bg-indigo-50/20">
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-indigo-600"><Monitor size={18}/> Diagnostic Console</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-indigo-700/70 leading-relaxed">
                    Enable Diagnostic Mode to view route metadata, cluster permissions, and data source origin at the top of every page.
                </p>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded border border-indigo-100">
                    <span className="text-xs font-bold uppercase">Diagnostic Overlay</span>
                    <Button 
                        size="sm" 
                        variant={localStorage.getItem('DIAG_ENABLED') === '1' ? 'destructive' : 'default'}
                        onClick={() => {
                            const current = localStorage.getItem('DIAG_ENABLED') === '1';
                            localStorage.setItem('DIAG_ENABLED', current ? '0' : '1');
                            window.location.reload();
                        }}
                        className="h-8 text-[10px] font-black"
                    >
                        {localStorage.getItem('DIAG_ENABLED') === '1' ? 'DISABLE' : 'ENABLE'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
);

const UsersTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded border border-blue-100 dark:border-blue-900 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold">Identity Management Preview</p>
                <p className="mt-1">Permissions are governed by Access Control policies. This view manages identity-to-role mapping.</p>
            </div>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Registered Users (Sample)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role Cluster</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {[
                            { name: 'Alice Admin', email: 'alice@aayatana.com', role: 'Super User', status: 'Active' },
                            { name: 'Bob Build', email: 'bob@aayatana.com', role: 'C2 Manufacturing', status: 'Active' },
                        ].map((u, i) => (
                            <TableRow key={i} className="opacity-75">
                                <TableCell className="font-medium">{u.name}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                                <TableCell>{u.status}</TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

const ApiKeysTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <Card>
            <CardHeader><CardTitle className="text-base">Active Keys</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Key Name</TableHead>
                            <TableHead>Prefix</TableHead>
                            <TableHead>Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {[
                            { name: 'MQTT Ingest - Plant A', prefix: 'pk_live_...', date: '2023-11-01' },
                        ].map((k, i) => (
                            <TableRow key={i} className="opacity-75">
                                <TableCell className="font-medium">{k.name}</TableCell>
                                <TableCell className="font-mono text-xs">{k.prefix}••••</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{k.date}</TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

const NotificationsTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <Card>
            <CardHeader><CardTitle className="text-base">Event Subscriptions</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Channels</TableHead>
                            <TableHead className="text-right">Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {[
                            { event: 'Custody: Acceptance SLA Breach', chan: 'Email, In-App' },
                            { event: 'EOL: Failure Rate Spike', chan: 'Email, SMS' },
                        ].map((n, i) => (
                            <TableRow key={i} className="opacity-75">
                                <TableCell className="font-medium">{n.event}</TableCell>
                                <TableCell className="text-xs">{n.chan}</TableCell>
                                <TableCell className="text-right">
                                    <DisabledToggle checked={true} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

const WebhooksTab = () => (
    <div className="space-y-6 animate-in fade-in">
        <Card>
            <CardHeader><CardTitle className="text-base">Outbound Webhooks</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Target URL</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <tbody>
                        {[
                            { name: 'SAP ERP Sync', url: 'https://api.sap.corp/hooks/•••', status: 'Active' },
                        ].map((w, i) => (
                            <TableRow key={i} className="opacity-75">
                                <TableCell className="font-medium">{w.name}</TableCell>
                                <TableCell className="font-mono text-xs">{w.url}</TableCell>
                                <TableCell><Badge variant="success">{w.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </tbody>
                </Table>
            </CardContent>
        </Card>
    </div>
);

export default function Settings() {
    const { currentCluster, addNotification } = useAppStore();
    const [activeTab, setActiveTab] = useState('profile');

    // Permissions
    const showProfile = canView(currentCluster?.id || '', ScreenId.SETTINGS_PROFILE);
    const showUsers = canView(currentCluster?.id || '', ScreenId.SETTINGS_USERS);
    const showKeys = canView(currentCluster?.id || '', ScreenId.SETTINGS_API_KEYS);
    const showNotifs = canView(currentCluster?.id || '', ScreenId.SETTINGS_NOTIFICATIONS);
    const showWebhooks = canView(currentCluster?.id || '', ScreenId.SETTINGS_WEBHOOKS);
    const canExport = canDo(currentCluster?.id || '', ScreenId.SETTINGS_EXPORT, 'X');

    const handleExport = () => {
        const spec = generateSettingsSpec();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spec, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `settings_spec_v${spec.version}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addNotification({ title: "Exported", message: "Settings schema specification downloaded.", type: "success" });
    };

    if (!showProfile && !showUsers && !showKeys && !showNotifs && !showWebhooks) {
        return <div className="p-10 text-center">Access Denied</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                    <p className="text-muted-foreground">Control plane for identity, access, integrations, and communications.</p>
                </div>
                {canExport && (
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Download Spec
                    </Button>
                )}
            </div>

            {/* Banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-bold uppercase">Backend Integration Required</p>
                    <p>Primary configuration fields are gated by backend identity services. This view currently functions as a read-only console.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b flex gap-6 text-sm font-medium text-muted-foreground overflow-x-auto">
                <button className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('profile')}>
                    <Building className="h-4 w-4" /> Profile
                </button>
                {showUsers && <button className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('users')}>
                    <Users className="h-4 w-4" /> Users
                </button>}
                {showKeys && <button className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'keys' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('keys')}>
                    <Key className="h-4 w-4" /> API Keys
                </button>}
                {showNotifs && <button className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('notifications')}>
                    <Bell className="h-4 w-4" /> Notifications
                </button>}
                {showWebhooks && <button className={`pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'webhooks' ? 'border-primary text-primary' : 'border-transparent hover:text-foreground'}`} onClick={() => setActiveTab('webhooks')}>
                    <Webhook className="h-4 w-4" /> Webhooks
                </button>}
            </div>

            {/* Tab Content */}
            <div className="pt-2">
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'keys' && <ApiKeysTab />}
                {activeTab === 'notifications' && <NotificationsTab />}
                {activeTab === 'webhooks' && <WebhooksTab />}
            </div>
        </div>
    );
}