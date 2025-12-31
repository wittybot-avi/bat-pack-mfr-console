
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
  FileSpreadsheet
} from 'lucide-react';
import { ScreenId } from '../rbac/screenIds';

// Fix: Add RouteConfig interface for registry mapping
export interface RouteConfig {
  icon: any;
  label: string;
  path: string;
  screenId: ScreenId;
  componentName: string;
}

export const APP_ROUTES: Record<string, RouteConfig> = {
  [ScreenId.DASHBOARD]: { icon: LayoutDashboard, label: 'Dashboard', path: '/', screenId: ScreenId.DASHBOARD, componentName: 'Dashboard.tsx' },
  [ScreenId.TELEMETRY]: { icon: Activity, label: 'Telemetry', path: '/telemetry', screenId: ScreenId.TELEMETRY, componentName: 'Telemetry.tsx' },
  [ScreenId.ANALYTICS]: { icon: BarChart3, label: 'Analytics', path: '/analytics', screenId: ScreenId.ANALYTICS, componentName: 'Analytics.tsx' },
  
  [ScreenId.SKU_LIST]: { icon: Layers, label: 'SKU Design', path: '/sku', screenId: ScreenId.SKU_LIST, componentName: 'SkuList.tsx' },
  
  [ScreenId.CELL_LOTS_LIST]: { icon: Archive, label: 'Cell Serialization', path: '/trace/cells', screenId: ScreenId.CELL_LOTS_LIST, componentName: 'CellLotsList.tsx' },
  [ScreenId.LINEAGE_VIEW]: { icon: History, label: 'Lineage Audit', path: '/trace/lineage/:id', screenId: ScreenId.LINEAGE_VIEW, componentName: 'LineageView.tsx' },
  
  [ScreenId.BATCHES_LIST]: { icon: Box, label: 'Manufacturing Batches', path: '/batches', screenId: ScreenId.BATCHES_LIST, componentName: 'Batches.tsx' },
  [ScreenId.BATCHES_DETAIL]: { icon: Box, label: 'Batch Details', path: '/batches/:id', screenId: ScreenId.BATCHES_DETAIL, componentName: 'BatchDetail.tsx' },
  
  [ScreenId.MODULE_ASSEMBLY_LIST]: { icon: Layers, label: 'Module Assembly', path: '/operate/modules', screenId: ScreenId.MODULE_ASSEMBLY_LIST, componentName: 'ModuleAssemblyList.tsx' },
  [ScreenId.MODULE_ASSEMBLY_DETAIL]: { icon: Layers, label: 'Module Detail', path: '/operate/modules/:id', screenId: ScreenId.MODULE_ASSEMBLY_DETAIL, componentName: 'ModuleAssemblyDetail.tsx' },
  
  [ScreenId.PACK_ASSEMBLY_LIST]: { icon: Box, label: 'Pack Assembly', path: '/operate/packs', screenId: ScreenId.PACK_ASSEMBLY_LIST, componentName: 'PackAssemblyList.tsx' },
  [ScreenId.PACK_ASSEMBLY_DETAIL]: { icon: Box, label: 'Pack Detail', path: '/operate/packs/:id', screenId: ScreenId.PACK_ASSEMBLY_DETAIL, componentName: 'PackAssemblyDetail.tsx' },
  
  [ScreenId.BATTERIES_LIST]: { icon: Zap, label: 'Battery Trace', path: '/batteries', screenId: ScreenId.BATTERIES_LIST, componentName: 'Batteries.tsx' },
  [ScreenId.BATTERIES_DETAIL]: { icon: Zap, label: 'Battery Detail', path: '/batteries/:id', screenId: ScreenId.BATTERIES_DETAIL, componentName: 'BatteryDetail.tsx' },
  
  [ScreenId.PROVISIONING]: { icon: Cpu, label: 'BMS Provisioning', path: '/provisioning', screenId: ScreenId.PROVISIONING, componentName: 'ProvisioningConsole.tsx' },
  [ScreenId.PROVISIONING_STATION_SETUP]: { icon: Settings, label: 'Provisioning Setup', path: '/provisioning/setup', screenId: ScreenId.PROVISIONING_STATION_SETUP, componentName: 'ProvisioningStationSetup.tsx' },
  
  [ScreenId.INVENTORY]: { icon: Warehouse, label: 'Inventory', path: '/inventory', screenId: ScreenId.INVENTORY, componentName: 'InventoryList.tsx' },
  [ScreenId.DISPATCH_LIST]: { icon: Truck, label: 'Dispatch Orders', path: '/dispatch', screenId: ScreenId.DISPATCH_LIST, componentName: 'DispatchList.tsx' },
  [ScreenId.DISPATCH_DETAIL]: { icon: Truck, label: 'Dispatch Details', path: '/dispatch/:orderId', screenId: ScreenId.DISPATCH_DETAIL, componentName: 'DispatchDetail.tsx' },

  [ScreenId.EOL_QA_STATION]: { icon: ClipboardCheck, label: 'EOL / QA Queue', path: '/eol', screenId: ScreenId.EOL_QA_STATION, componentName: 'EolQaList.tsx' },
  [ScreenId.EOL_QA_DETAIL]: { icon: ClipboardList, label: 'EOL Details', path: '/assure/eol/:id', screenId: ScreenId.EOL_QA_DETAIL, componentName: 'EolQaDetail.tsx' },
  [ScreenId.EOL_QA_STATION_SETUP]: { icon: Settings, label: 'EOL Station Setup', path: '/assure/eol-setup', screenId: ScreenId.EOL_QA_STATION_SETUP, componentName: 'EolStationSetup.tsx' },

  [ScreenId.COMPLIANCE]: { icon: ShieldCheck, label: 'Compliance', path: '/compliance', screenId: ScreenId.COMPLIANCE, componentName: 'Compliance.tsx' },
  [ScreenId.CUSTODY]: { icon: History, label: 'Chain of Custody', path: '/custody', screenId: ScreenId.CUSTODY, componentName: 'Custody.tsx' },
  
  [ScreenId.WARRANTY]: { icon: FileText, label: 'Warranty & Returns', path: '/warranty', screenId: ScreenId.WARRANTY, componentName: 'Warranty.tsx' },
  [ScreenId.WARRANTY_EXTERNAL_INTAKE]: { icon: FileSpreadsheet, label: 'Submit Claim', path: '/warranty/intake', screenId: ScreenId.WARRANTY_EXTERNAL_INTAKE, componentName: 'WarrantyIntake.tsx' },

  [ScreenId.SETTINGS]: { icon: Settings, label: 'Settings', path: '/settings', screenId: ScreenId.SETTINGS, componentName: 'Settings.tsx' },
  [ScreenId.RBAC_VIEW]: { icon: Shield, label: 'Access Audit', path: '/admin/rbac', screenId: ScreenId.RBAC_VIEW, componentName: 'RbacAdmin.tsx' },
};

// Fix: Added checkConsistency utility for diagnostic validation
export function checkConsistency() {
  const warnings: string[] = [];
  Object.values(ScreenId).forEach(id => {
      if (!APP_ROUTES[id]) warnings.push(`Missing route config for screen: ${id}`);
  });
  return warnings;
}
