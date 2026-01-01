import { 
  LayoutDashboard,
  Activity,
  BarChart3,
  Layers,
  Archive,
  ClipboardList,
  ClipboardCheck,
  Search,
  Box,
  Truck,
  ShieldCheck,
  History,
  Settings,
  Shield,
  Zap,
  Cpu,
  FileText,
  Warehouse,
  FileSpreadsheet,
  BookOpen,
  Map,
  Globe,
  Leaf,
  Recycle,
  Fingerprint,
  Play
} from 'lucide-react';
import { ScreenId } from '../rbac/screenIds';

export interface RouteConfig {
  icon: any;
  label: string;
  path: string;
  screenId: ScreenId;
  componentName: string;
}

/**
 * Route Registry
 * Maps granular Screen IDs to their primary entry routes for Diagnostic validation.
 */
export const APP_ROUTES: Record<string, RouteConfig> = {
  // Guided
  [ScreenId.RUNBOOK_HUB]: { icon: BookOpen, label: 'Runbooks', path: '/runbooks', screenId: ScreenId.RUNBOOK_HUB, componentName: 'RunbookHub.tsx' },
  [ScreenId.RUNBOOK_DETAIL]: { icon: Map, label: 'Runbook Details', path: '/runbooks/:runbookId', screenId: ScreenId.RUNBOOK_DETAIL, componentName: 'RunbookDetail.tsx' },

  // Observe
  [ScreenId.DASHBOARD]: { icon: LayoutDashboard, label: 'Dashboard', path: '/', screenId: ScreenId.DASHBOARD, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_EXEC_SUMMARY]: { icon: LayoutDashboard, label: 'Dashboard: Summary', path: '/', screenId: ScreenId.DASHBOARD_EXEC_SUMMARY, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_PRODUCTION]: { icon: LayoutDashboard, label: 'Dashboard: Production', path: '/', screenId: ScreenId.DASHBOARD_PRODUCTION, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_QUALITY]: { icon: LayoutDashboard, label: 'Dashboard: Quality', path: '/', screenId: ScreenId.DASHBOARD_QUALITY, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_LOGISTICS]: { icon: LayoutDashboard, label: 'Dashboard: Logistics', path: '/', screenId: ScreenId.DASHBOARD_LOGISTICS, componentName: 'Dashboard.tsx' },
  [ScreenId.DASHBOARD_RISK_COMPLIANCE]: { icon: LayoutDashboard, label: 'Dashboard: Risk', path: '/', screenId: ScreenId.DASHBOARD_RISK_COMPLIANCE, componentName: 'Dashboard.tsx' },

  [ScreenId.TELEMETRY]: { icon: Activity, label: 'Telemetry', path: '/telemetry', screenId: ScreenId.TELEMETRY, componentName: 'Telemetry.tsx' },
  [ScreenId.TELEMETRY_LIVE_VIEW]: { icon: Activity, label: 'Telemetry: Live', path: '/telemetry', screenId: ScreenId.TELEMETRY_LIVE_VIEW, componentName: 'Telemetry.tsx' },
  [ScreenId.TELEMETRY_HISTORY_VIEW]: { icon: Activity, label: 'Telemetry: History', path: '/telemetry', screenId: ScreenId.TELEMETRY_HISTORY_VIEW, componentName: 'Telemetry.tsx' },
  [ScreenId.TELEMETRY_EXPORT]: { icon: Activity, label: 'Telemetry: Export', path: '/telemetry', screenId: ScreenId.TELEMETRY_EXPORT, componentName: 'Telemetry.tsx' },

  [ScreenId.ANALYTICS]: { icon: BarChart3, label: 'Analytics', path: '/analytics', screenId: ScreenId.ANALYTICS, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_OVERVIEW_TAB]: { icon: BarChart3, label: 'Analytics: Overview', path: '/analytics', screenId: ScreenId.ANALYTICS_OVERVIEW_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_BATCH_TAB]: { icon: BarChart3, label: 'Analytics: Batches', path: '/analytics', screenId: ScreenId.ANALYTICS_BATCH_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_STATION_TAB]: { icon: BarChart3, label: 'Analytics: Stations', path: '/analytics', screenId: ScreenId.ANALYTICS_STATION_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_QUALITY_TAB]: { icon: BarChart3, label: 'Analytics: Quality', path: '/analytics', screenId: ScreenId.ANALYTICS_QUALITY_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_LOCATION_TAB]: { icon: BarChart3, label: 'Analytics: Location', path: '/analytics', screenId: ScreenId.ANALYTICS_LOCATION_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_REPORTS_TAB]: { icon: BarChart3, label: 'Analytics: Reports', path: '/analytics', screenId: ScreenId.ANALYTICS_REPORTS_TAB, componentName: 'Analytics.tsx' },
  [ScreenId.ANALYTICS_EXPORT]: { icon: BarChart3, label: 'Analytics: Export', path: '/analytics', screenId: ScreenId.ANALYTICS_EXPORT, componentName: 'Analytics.tsx' },
  
  // Design
  [ScreenId.SKU_LIST]: { icon: Layers, label: 'SKU Design', path: '/sku', screenId: ScreenId.SKU_LIST, componentName: 'SkuList.tsx' },
  
  // Trace
  [ScreenId.CELL_LOTS_LIST]: { icon: Archive, label: 'Cell Serialization', path: '/trace/cells', screenId: ScreenId.CELL_LOTS_LIST, componentName: 'CellLotsList.tsx' },
  [ScreenId.LINEAGE_VIEW]: { icon: History, label: 'Lineage Audit', path: '/trace/lineage/:id', screenId: ScreenId.LINEAGE_VIEW, componentName: 'LineageView.tsx' },
  
  // Operate
  [ScreenId.BATCHES_LIST]: { icon: Box, label: 'Manufacturing Batches', path: '/batches', screenId: ScreenId.BATCHES_LIST, componentName: 'Batches.tsx' },
  [ScreenId.BATCHES_CREATE]: { icon: Box, label: 'Create Batch', path: '/batches', screenId: ScreenId.BATCHES_CREATE, componentName: 'Batches.tsx' },
  [ScreenId.BATCHES_DETAIL]: { icon: Box, label: 'Batch Details', path: '/batches/:id', screenId: ScreenId.BATCHES_DETAIL, componentName: 'BatchDetail.tsx' },
  
  [ScreenId.MODULE_ASSEMBLY_LIST]: { icon: Layers, label: 'Module Assembly', path: '/operate/modules', screenId: ScreenId.MODULE_ASSEMBLY_LIST, componentName: 'ModuleAssemblyList.tsx' },
  [ScreenId.MODULE_ASSEMBLY_DETAIL]: { icon: Layers, label: 'Module Detail', path: '/operate/modules/:id', screenId: ScreenId.MODULE_ASSEMBLY_DETAIL, componentName: 'ModuleAssemblyDetail.tsx' },
  
  [ScreenId.PACK_ASSEMBLY_LIST]: { icon: Box, label: 'Pack Assembly', path: '/operate/packs', screenId: ScreenId.PACK_ASSEMBLY_LIST, componentName: 'PackAssemblyList.tsx' },
  [ScreenId.PACK_ASSEMBLY_DETAIL]: { icon: Box, label: 'Pack Detail', path: '/operate/packs/:id', screenId: ScreenId.PACK_ASSEMBLY_DETAIL, componentName: 'PackAssemblyDetail.tsx' },
  
  [ScreenId.BATTERIES_LIST]: { icon: Fingerprint, label: 'Battery Identity', path: '/batteries', screenId: ScreenId.BATTERIES_LIST, componentName: 'Batteries.tsx' },
  [ScreenId.BATTERIES_DETAIL]: { icon: Zap, label: 'Battery Detail', path: '/batteries/:id', screenId: ScreenId.BATTERIES_DETAIL, componentName: 'BatteryDetail.tsx' },
  
  [ScreenId.PROVISIONING]: { icon: Cpu, label: 'Provisioning Workstation', path: '/assure/provisioning/:id', screenId: ScreenId.PROVISIONING, componentName: 'ProvisioningConsole.tsx' },
  [ScreenId.PROVISIONING_QUEUE]: { icon: Cpu, label: 'Provisioning Queue', path: '/manufacturing/provisioning/queue', screenId: ScreenId.PROVISIONING_QUEUE, componentName: 'ProvisioningQueue.tsx' },
  [ScreenId.PROVISIONING_STATION_SETUP]: { icon: Settings, label: 'Provisioning Setup', path: '/provisioning/setup', screenId: ScreenId.PROVISIONING_STATION_SETUP, componentName: 'ProvisioningStationSetup.tsx' },
  
  [ScreenId.INVENTORY]: { icon: Warehouse, label: 'Inventory', path: '/inventory', screenId: ScreenId.INVENTORY, componentName: 'InventoryList.tsx' },
  [ScreenId.DISPATCH]: { icon: Truck, label: 'Dispatch', path: '/dispatch', screenId: ScreenId.DISPATCH, componentName: 'DispatchList.tsx' },
  [ScreenId.DISPATCH_LIST]: { icon: Truck, label: 'Dispatch Orders', path: '/dispatch', screenId: ScreenId.DISPATCH_LIST, componentName: 'DispatchList.tsx' },
  [ScreenId.DISPATCH_DETAIL]: { icon: Truck, label: 'Dispatch Details', path: '/dispatch/:orderId', screenId: ScreenId.DISPATCH_DETAIL, componentName: 'DispatchDetail.tsx' },

  // Assure (Stabilized Canonical Routes for P45)
  [ScreenId.EOL_QA_QUEUE]: { icon: ClipboardCheck, label: 'EOL / QA Queue', path: '/assure/eol/queue', screenId: ScreenId.EOL_QA_QUEUE, componentName: 'EolQaList.tsx' },
  [ScreenId.EOL_SETUP]: { icon: Settings, label: 'EOL Station Setup', path: '/assure/eol/setup', screenId: ScreenId.EOL_SETUP, componentName: 'EolStationSetup.tsx' },
  [ScreenId.EOL_REVIEW]: { icon: ClipboardList, label: 'EOL Review', path: '/assure/eol/review', screenId: ScreenId.EOL_REVIEW, componentName: 'EolReview.tsx' },
  [ScreenId.EOL_DETAILS]: { icon: Search, label: 'EOL Analysis', path: '/assure/eol/details/:id', screenId: ScreenId.EOL_DETAILS, componentName: 'EolDetails.tsx' },
  [ScreenId.EOL_RUN_TEST]: { icon: Play, label: 'EOL Test Session', path: '/assure/eol/run/:id', screenId: ScreenId.EOL_RUN_TEST, componentName: 'EolRunTest.tsx' },
  [ScreenId.EOL_AUDIT_DETAIL]: { icon: History, label: 'EOL Audit Detail', path: '/assure/eol/audit/:id', screenId: ScreenId.EOL_AUDIT_DETAIL, componentName: 'EolAuditDetail.tsx' },

  // Govern
  [ScreenId.COMPLIANCE]: { icon: ShieldCheck, label: 'Compliance', path: '/compliance', screenId: ScreenId.COMPLIANCE, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_OVERVIEW_TAB]: { icon: ShieldCheck, label: 'Compliance: Overview', path: '/compliance', screenId: ScreenId.COMPLIANCE_OVERVIEW_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_CHECKS_TAB]: { icon: ShieldCheck, label: 'Compliance: Checks', path: '/compliance', screenId: ScreenId.COMPLIANCE_CHECKS_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_FINDINGS_TAB]: { icon: ShieldCheck, label: 'Compliance: Findings', path: '/compliance', screenId: ScreenId.COMPLIANCE_FINDINGS_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_EVIDENCE_TAB]: { icon: ShieldCheck, label: 'Compliance: Evidence', path: '/compliance', screenId: ScreenId.COMPLIANCE_EVIDENCE_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB]: { icon: ShieldCheck, label: 'Compliance: Audit', path: '/compliance', screenId: ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_FUTURE_TAB]: { icon: ShieldCheck, label: 'Compliance: Future', path: '/compliance', screenId: ScreenId.COMPLIANCE_FUTURE_TAB, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_FINDINGS_EDIT]: { icon: ShieldCheck, label: 'Compliance: Edit Finding', path: '/compliance', screenId: ScreenId.COMPLIANCE_FINDINGS_EDIT, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_DPP_PREVIEW]: { icon: Globe, label: 'DPP Preview', path: '/compliance', screenId: ScreenId.COMPLIANCE_DPP_PREVIEW, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_SUSTAINABILITY_PREVIEW]: { icon: Leaf, label: 'Sust. Preview', path: '/compliance', screenId: ScreenId.COMPLIANCE_SUSTAINABILITY_PREVIEW, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_RECYCLING_PREVIEW]: { icon: Recycle, label: 'Recycle Preview', path: '/compliance', screenId: ScreenId.COMPLIANCE_RECYCLING_PREVIEW, componentName: 'Compliance.tsx' },
  [ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW]: { icon: FileText, label: 'Reg. Export Preview', path: '/compliance', screenId: ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW, componentName: 'Compliance.tsx' },

  [ScreenId.CUSTODY]: { icon: History, label: 'Chain of Custody', path: '/custody', screenId: ScreenId.CUSTODY, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_OVERVIEW]: { icon: History, label: 'Custody: Overview', path: '/custody', screenId: ScreenId.CUSTODY_OVERVIEW, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_LIST]: { icon: History, label: 'Custody: List', path: '/custody', screenId: ScreenId.CUSTODY_LIST, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_EXCEPTIONS]: { icon: History, label: 'Custody: Exceptions', path: '/custody', screenId: ScreenId.CUSTODY_EXCEPTIONS, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_RECEIVE_ACTION]: { icon: History, label: 'Custody: Receive', path: '/custody', screenId: ScreenId.CUSTODY_RECEIVE_ACTION, componentName: 'Custody.tsx' },
  [ScreenId.CUSTODY_ACCEPT_REJECT_ACTION]: { icon: History, label: 'Custody: Accept/Reject', path: '/custody', screenId: ScreenId.CUSTODY_ACCEPT_REJECT_ACTION, componentName: 'Custody.tsx' },
  
  // Resolve
  [ScreenId.WARRANTY]: { icon: FileText, label: 'Warranty & Returns', path: '/warranty', screenId: ScreenId.WARRANTY, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_OVERVIEW]: { icon: FileText, label: 'Warranty: Overview', path: '/warranty', screenId: ScreenId.WARRANTY_OVERVIEW, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_CLAIMS_LIST]: { icon: FileText, label: 'Warranty: List', path: '/warranty', screenId: ScreenId.WARRANTY_CLAIMS_LIST, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_EXTERNAL_INTAKE]: { icon: FileSpreadsheet, label: 'Submit Claim', path: '/warranty/intake', screenId: ScreenId.WARRANTY_EXTERNAL_INTAKE, componentName: 'WarrantyIntake.tsx' },
  [ScreenId.WARRANTY_CREATE_CLAIM_INTERNAL]: { icon: FileText, label: 'Warranty: Create Internal', path: '/warranty', screenId: ScreenId.WARRANTY_CREATE_CLAIM_INTERNAL, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL]: { icon: FileText, label: 'Warranty: Update Internal', path: '/warranty', screenId: ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_DECIDE_DISPOSITION]: { icon: FileText, label: 'Warranty: Decide', path: '/warranty', screenId: ScreenId.WARRANTY_DECIDE_DISPOSITION, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_CLOSE_CLAIM]: { icon: FileText, label: 'Warranty: Close', path: '/warranty', screenId: ScreenId.WARRANTY_CLOSE_CLAIM, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_EXPORT]: { icon: FileText, label: 'Warranty: Export', path: '/warranty', screenId: ScreenId.WARRANTY_EXPORT, componentName: 'Warranty.tsx' },

  // Admin
  [ScreenId.SETTINGS]: { icon: Settings, label: 'Settings', path: '/settings', screenId: ScreenId.SETTINGS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_PROFILE]: { icon: Settings, label: 'Settings: Profile', path: '/settings', screenId: ScreenId.SETTINGS_PROFILE, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_USERS]: { icon: Settings, label: 'Settings: Users', path: '/settings', screenId: ScreenId.SETTINGS_USERS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_API_KEYS]: { icon: Settings, label: 'Settings: API', path: '/settings', screenId: ScreenId.SETTINGS_API_KEYS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_NOTIFICATIONS]: { icon: Settings, label: 'Settings: Notif', path: '/settings', screenId: ScreenId.SETTINGS_NOTIFICATIONS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_WEBHOOKS]: { icon: Settings, label: 'Settings: Webhooks', path: '/settings', screenId: ScreenId.SETTINGS_WEBHOOKS, componentName: 'Settings.tsx' },
  [ScreenId.SETTINGS_EXPORT]: { icon: Settings, label: 'Settings: Export', path: '/settings', screenId: ScreenId.SETTINGS_EXPORT, componentName: 'Settings.tsx' },
  [ScreenId.RBAC_VIEW]: { icon: Shield, label: 'Access Audit', path: '/admin/rbac', screenId: ScreenId.RBAC_VIEW, componentName: 'RbacAdmin.tsx' },
};

export function checkConsistency() {
  const warnings: string[] = [];
  Object.values(ScreenId).forEach(id => {
      if (!APP_ROUTES[id]) warnings.push(`Missing route config for screen: ${id}`);
  });
  return warnings;
}