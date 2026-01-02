// NO ALIAS IMPORTS ALLOWED
import { ScreenId } from '../rbac/screenIds';
import { matchPath } from 'react-router-dom';
import { 
  LayoutDashboard, Activity, BarChart3, Layers, Archive, 
  Box, Truck, ShieldCheck, History, BookOpen, Warehouse, 
  ClipboardList, ClipboardCheck, Zap, Fingerprint, Map, 
  Plus, Settings, Shield, Play, Package, Boxes, Hash, GitBranch, LineChart,
  Battery
} from 'lucide-react';

export interface RouteLedgerEntry {
  path: string;
  screenId: ScreenId;
  title: string;
  navVisible: boolean;
  module: "OPERATE" | "ASSURE" | "RESOLVE" | "GOVERN" | "ADMIN" | "TRACE" | "OBSERVE" | "GUIDED";
  icon: any;
  diagnosticCapable: true;
}

/**
 * CANONICAL ROUTE LEDGER - P-056H4 STABLE
 * Every navigable path MUST be registered here.
 */
export const ROUTE_LEDGER: RouteLedgerEntry[] = [
  // Dashboard / Base
  { path: "/", screenId: ScreenId.DASHBOARD, title: "Dashboard", navVisible: true, module: "OBSERVE", icon: LayoutDashboard, diagnosticCapable: true },
  
  // Guided
  { path: "/runbooks", screenId: ScreenId.RUNBOOK_HUB, title: "Runbooks", navVisible: true, module: "GUIDED", icon: BookOpen, diagnosticCapable: true },
  { path: "/runbooks/:runbookId", screenId: ScreenId.RUNBOOK_DETAIL, title: "Runbook Detail", navVisible: false, module: "GUIDED", icon: Map, diagnosticCapable: true },

  // Observe
  { path: "/telemetry", screenId: ScreenId.TELEMETRY, title: "Telemetry", navVisible: true, module: "OBSERVE", icon: Activity, diagnosticCapable: true },
  { path: "/analytics", screenId: ScreenId.ANALYTICS, title: "Analytics", navVisible: true, module: "OBSERVE", icon: LineChart, diagnosticCapable: true },

  // Design
  { path: "/manufacturing/sku-design", screenId: ScreenId.SKU_LIST, title: "SKU Design Studio", navVisible: true, module: "OPERATE", icon: Layers, diagnosticCapable: true },
  { path: "/manufacturing/sku-design/:id", screenId: ScreenId.SKU_DETAIL, title: "SKU Detail", navVisible: false, module: "OPERATE", icon: Layers, diagnosticCapable: true },

  // Trace
  { path: "/trace/cells/lot-happy", screenId: ScreenId.CELL_LOTS_LIST, title: "Cell Serialization", navVisible: true, module: "TRACE", icon: Hash, diagnosticCapable: true },
  { path: "/trace/cells/new", screenId: ScreenId.CELL_LOTS_CREATE, title: "Register Shipment", navVisible: false, module: "TRACE", icon: Plus, diagnosticCapable: true },
  { path: "/trace/cells/:lotId", screenId: ScreenId.CELL_LOTS_DETAIL, title: "Cell Lot Detail", navVisible: false, module: "TRACE", icon: Archive, diagnosticCapable: true },
  { path: "/trace/lineage", screenId: ScreenId.LINEAGE_VIEW, title: "Lineage Audit", navVisible: true, module: "TRACE", icon: GitBranch, diagnosticCapable: true },
  { path: "/trace/lineage/:id", screenId: ScreenId.LINEAGE_VIEW, title: "Lineage Audit Detail", navVisible: false, module: "TRACE", icon: History, diagnosticCapable: true },

  // Operate
  { path: "/manufacturing/batches", screenId: ScreenId.BATCHES_LIST, title: "Batches", navVisible: true, module: "OPERATE", icon: ClipboardList, diagnosticCapable: true },
  { path: "/manufacturing/batches/:id", screenId: ScreenId.BATCHES_DETAIL, title: "Batch Detail", navVisible: false, module: "OPERATE", icon: ClipboardList, diagnosticCapable: true },
  
  { path: "/manufacturing/module-assembly", screenId: ScreenId.MODULE_ASSEMBLY_LIST, title: "Module Assembly", navVisible: true, module: "OPERATE", icon: Boxes, diagnosticCapable: true },
  { path: "/manufacturing/module-assembly/:id", screenId: ScreenId.MODULE_ASSEMBLY_DETAIL, title: "Module Detail", navVisible: false, module: "OPERATE", icon: Boxes, diagnosticCapable: true },
  
  { path: "/manufacturing/pack-assembly", screenId: ScreenId.PACK_ASSEMBLY_LIST, title: "Pack Assembly", navVisible: true, module: "OPERATE", icon: Package, diagnosticCapable: true },
  { path: "/manufacturing/pack-assembly/:id", screenId: ScreenId.PACK_ASSEMBLY_DETAIL, title: "Pack Detail", navVisible: false, module: "OPERATE", icon: Package, diagnosticCapable: true },
  
  { path: "/manufacturing/battery-identity", screenId: ScreenId.BATTERIES_LIST, title: "Battery Identity", navVisible: true, module: "OPERATE", icon: Fingerprint, diagnosticCapable: true },
  { path: "/manufacturing/battery-identity/:id", screenId: ScreenId.BATTERIES_DETAIL, title: "Battery Detail", navVisible: false, module: "OPERATE", icon: Battery, diagnosticCapable: true },
  
  { path: "/manufacturing/provisioning/queue", screenId: ScreenId.PROVISIONING_QUEUE, title: "Provisioning Queue", navVisible: true, module: "OPERATE", icon: ShieldCheck, diagnosticCapable: true },
  { path: "/manufacturing/provisioning/setup", screenId: ScreenId.PROVISIONING_STATION_SETUP, title: "Provisioning Setup", navVisible: false, module: "OPERATE", icon: Settings, diagnosticCapable: true },
  { path: "/assure/provisioning/:batteryId", screenId: ScreenId.PROVISIONING, title: "Provisioning Console", navVisible: false, module: "OPERATE", icon: Zap, diagnosticCapable: true },
  
  { path: "/inventory", screenId: ScreenId.INVENTORY, title: "Inventory", navVisible: true, module: "OPERATE", icon: Warehouse, diagnosticCapable: true },
  { path: "/inventory/:id", screenId: ScreenId.BATTERIES_DETAIL, title: "Inventory Item Detail", navVisible: false, module: "OPERATE", icon: Warehouse, diagnosticCapable: true },
  
  { path: "/dispatch-orders", screenId: ScreenId.DISPATCH_LIST, title: "Dispatch List", navVisible: true, module: "OPERATE", icon: Truck, diagnosticCapable: true },
  { path: "/dispatch-orders/:orderId", screenId: ScreenId.DISPATCH_DETAIL, title: "Dispatch Detail", navVisible: false, module: "OPERATE", icon: Truck, diagnosticCapable: true },

  // Assure
  { path: "/assure/eol/qa-queue", screenId: ScreenId.EOL_QA_QUEUE, title: "EOL / QA Queue", navVisible: true, module: "ASSURE", icon: ClipboardCheck, diagnosticCapable: true },
  { path: "/assure/eol/station-setup", screenId: ScreenId.EOL_SETUP, title: "EOL Station Setup", navVisible: true, module: "ASSURE", icon: Settings, diagnosticCapable: true },
  { path: "/assure/eol/review", screenId: ScreenId.EOL_REVIEW, title: "EOL Review", navVisible: true, module: "ASSURE", icon: ShieldCheck, diagnosticCapable: true },
  { path: "/assure/eol/details/:buildId", screenId: ScreenId.EOL_DETAILS, title: "EOL Analysis", navVisible: false, module: "ASSURE", icon: Activity, diagnosticCapable: true },
  { path: "/assure/eol/run/:buildId", screenId: ScreenId.EOL_RUN_TEST, title: "EOL Test Session", navVisible: false, module: "ASSURE", icon: Play, diagnosticCapable: true },
  { path: "/assure/eol/audit/:buildId", screenId: ScreenId.EOL_AUDIT_DETAIL, title: "EOL Audit Detail", navVisible: false, module: "ASSURE", icon: History, diagnosticCapable: true },

  // Govern
  { path: "/govern/compliance", screenId: ScreenId.COMPLIANCE, title: "Compliance", navVisible: true, module: "GOVERN", icon: ShieldCheck, diagnosticCapable: true },
  { path: "/govern/chain-of-custody", screenId: ScreenId.CUSTODY, title: "Chain of Custody", navVisible: true, module: "GOVERN", icon: History, diagnosticCapable: true },
  { path: "/govern/chain-of-custody/:dispatchId", screenId: ScreenId.CUSTODY_DETAIL, title: "Custody Detail", navVisible: false, module: "GOVERN", icon: History, diagnosticCapable: true },

  // Resolve
  { path: "/resolve/warranty-returns", screenId: ScreenId.WARRANTY, title: "Warranty & Returns", navVisible: true, module: "RESOLVE", icon: Box, diagnosticCapable: true },
  { path: "/resolve/warranty-returns/claims/:claimId", screenId: ScreenId.WARRANTY_CLAIMS_LIST, title: "Warranty Claims", navVisible: false, module: "RESOLVE", icon: Box, diagnosticCapable: true },
  { path: "/warranty/intake", screenId: ScreenId.WARRANTY_EXTERNAL_INTAKE, title: "Submit Claim", navVisible: false, module: "RESOLVE", icon: Plus, diagnosticCapable: true },

  // Admin
  { path: "/admin/settings", screenId: ScreenId.SETTINGS, title: "Settings", navVisible: true, module: "ADMIN", icon: Settings, diagnosticCapable: true },
  { path: "/admin/access-audit", screenId: ScreenId.RBAC_VIEW, title: "Access Audit", navVisible: true, module: "ADMIN", icon: Shield, diagnosticCapable: true },
  { path: "/diagnostics/system-health", screenId: ScreenId.SYSTEM_HEALTH, title: "System Health", navVisible: true, module: "ADMIN", icon: Activity, diagnosticCapable: true },
];

/**
 * Resolves a URL pathname to a Ledger Entry using pattern matching.
 */
export function resolveRoute(pathname: string): RouteLedgerEntry | undefined {
  return ROUTE_LEDGER.find(r => 
    !!matchPath({ path: r.path, end: true }, pathname)
  );
}