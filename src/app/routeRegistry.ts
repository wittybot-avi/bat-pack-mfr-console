import { 
  LayoutDashboard, 
  Package, 
  Battery, 
  Cpu, 
  Activity, 
  ClipboardCheck, 
  Truck, 
  Settings, 
  ShieldCheck,
  Box,
  FileText,
  Lock,
  Container,
  AlertOctagon
} from 'lucide-react';
import { ScreenId } from '../rbac/screenIds';

export interface RouteConfig {
  screenId: ScreenId;
  path: string;
  label: string;
  icon: any;
  componentName: string; // Used for diagnostics
}

// Extracted from Layout.tsx for centralized management
export const APP_ROUTES: Record<string, RouteConfig> = {
  [ScreenId.DASHBOARD]: { icon: LayoutDashboard, label: 'Dashboard', path: '/', screenId: ScreenId.DASHBOARD, componentName: 'Dashboard.tsx' },
  [ScreenId.TELEMETRY]: { icon: Activity, label: 'Telemetry', path: '/telemetry', screenId: ScreenId.TELEMETRY, componentName: 'Telemetry.tsx' },
  [ScreenId.ANALYTICS]: { icon: FileText, label: 'Analytics', path: '/analytics', screenId: ScreenId.ANALYTICS, componentName: 'Analytics.tsx' },
  [ScreenId.BATCHES_LIST]: { icon: Package, label: 'Batches', path: '/batches', screenId: ScreenId.BATCHES_LIST, componentName: 'Batches.tsx' },
  [ScreenId.BATTERIES_LIST]: { icon: Battery, label: 'Batteries', path: '/batteries', screenId: ScreenId.BATTERIES_LIST, componentName: 'Batteries.tsx' },
  [ScreenId.PROVISIONING]: { icon: Cpu, label: 'Provisioning', path: '/provisioning', screenId: ScreenId.PROVISIONING, componentName: 'ProvisioningConsole.tsx' },
  [ScreenId.PROVISIONING_STATION_SETUP]: { icon: Settings, label: 'Station Setup', path: '/provisioning/setup', screenId: ScreenId.PROVISIONING_STATION_SETUP, componentName: 'ProvisioningStationSetup.tsx' },
  [ScreenId.INVENTORY]: { icon: Box, label: 'Inventory', path: '/inventory', screenId: ScreenId.INVENTORY, componentName: 'InventoryList.tsx' },
  [ScreenId.DISPATCH_LIST]: { icon: Truck, label: 'Dispatch', path: '/dispatch', screenId: ScreenId.DISPATCH_LIST, componentName: 'DispatchList.tsx' },
  [ScreenId.EOL_QA_STATION]: { icon: ClipboardCheck, label: 'EOL / QA', path: '/eol', screenId: ScreenId.EOL_QA_STATION, componentName: 'EolStation.tsx' },
  [ScreenId.EOL_QA_STATION_SETUP]: { icon: Settings, label: 'Station Setup', path: '/eol/setup', screenId: ScreenId.EOL_QA_STATION_SETUP, componentName: 'EolStationSetup.tsx' },
  [ScreenId.WARRANTY]: { icon: AlertOctagon, label: 'Warranty', path: '/warranty', screenId: ScreenId.WARRANTY, componentName: 'Warranty.tsx' },
  [ScreenId.COMPLIANCE]: { icon: ShieldCheck, label: 'Compliance', path: '/compliance', screenId: ScreenId.COMPLIANCE, componentName: 'Compliance.tsx' },
  [ScreenId.CUSTODY]: { icon: Container, label: 'Custody', path: '/custody', screenId: ScreenId.CUSTODY, componentName: 'Custody.tsx' }, 
  [ScreenId.SETTINGS]: { icon: Settings, label: 'Settings', path: '/settings', screenId: ScreenId.SETTINGS, componentName: 'Settings.tsx' },
  [ScreenId.RBAC_VIEW]: { icon: Lock, label: 'Access Control', path: '/admin/rbac', screenId: ScreenId.RBAC_VIEW, componentName: 'RbacAdmin.tsx' },
  // Detail pages (not in sidebar, but tracked)
  [ScreenId.BATCHES_DETAIL]: { icon: Package, label: 'Batch Detail', path: '/batches/:id', screenId: ScreenId.BATCHES_DETAIL, componentName: 'BatchDetail.tsx' },
  [ScreenId.BATTERIES_DETAIL]: { icon: Battery, label: 'Battery Detail', path: '/batteries/:id', screenId: ScreenId.BATTERIES_DETAIL, componentName: 'BatteryDetail.tsx' },
  [ScreenId.DISPATCH_DETAIL]: { icon: Truck, label: 'Dispatch Detail', path: '/dispatch/:id', screenId: ScreenId.DISPATCH_DETAIL, componentName: 'DispatchDetail.tsx' },
  [ScreenId.CUSTODY_DETAIL]: { icon: Container, label: 'Custody Detail', path: '/custody/:dispatchId', screenId: ScreenId.CUSTODY_DETAIL, componentName: 'CustodyDetail.tsx' },
  [ScreenId.WARRANTY_CLAIM_DETAIL]: { icon: AlertOctagon, label: 'Claim Detail', path: '/warranty/claims/:claimId', screenId: ScreenId.WARRANTY_CLAIM_DETAIL, componentName: 'WarrantyDetail.tsx' },
  [ScreenId.WARRANTY_EXTERNAL_INTAKE]: { icon: AlertOctagon, label: 'Warranty Intake', path: '/warranty/intake', screenId: ScreenId.WARRANTY_EXTERNAL_INTAKE, componentName: 'WarrantyIntake.tsx' },
};

export const checkConsistency = () => {
  const warnings: string[] = [];
  
  // 1. Check if all keys match screenId
  Object.entries(APP_ROUTES).forEach(([key, config]) => {
    if (key !== config.screenId) {
      warnings.push(`Mismatch: Key ${key} does not match screenId ${config.screenId}`);
    }
  });

  return warnings;
};
