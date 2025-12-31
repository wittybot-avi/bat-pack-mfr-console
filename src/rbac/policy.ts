
import { ScreenId } from './screenIds';
import { PermissionVerb } from './verbs';

type PermissionMap = {
  [key in ScreenId]?: PermissionVerb[];
};

type PolicyMap = {
  [clusterId: string]: PermissionMap;
};

// Default policy: explicit allow. If not listed, denied.
export const RBAC_POLICY: PolicyMap = {
  // C1: Executive - View All, minimal edit
  C1: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_PRODUCTION]: ['V'],
    [ScreenId.DASHBOARD_QUALITY]: ['V'],
    [ScreenId.DASHBOARD_LOGISTICS]: ['V'],
    [ScreenId.DASHBOARD_RISK_COMPLIANCE]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.TELEMETRY_LIVE_VIEW]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.SKU_LIST]: ['V'],
    [ScreenId.SKU_DETAIL]: ['V'],
    [ScreenId.CELL_LOTS_LIST]: ['V'],
    [ScreenId.CELL_LOT_DETAIL]: ['V'],
    [ScreenId.LINEAGE_VIEW]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V'],
    [ScreenId.MODULE_ASSEMBLY_LIST]: ['V'],
    [ScreenId.PACK_ASSEMBLY_LIST]: ['V'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.INVENTORY]: ['V'],
    [ScreenId.DISPATCH_LIST]: ['V'],
    [ScreenId.DISPATCH_DETAIL]: ['V'],
    [ScreenId.EOL_QA_STATION]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.CUSTODY]: ['V'],
    [ScreenId.SETTINGS]: ['V'],
    [ScreenId.RBAC_VIEW]: ['V'],
  },

  // C2: Manufacturing - Shopfloor execution (Production Manager Role)
  C2: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.SKU_LIST]: ['V', 'C', 'E'],
    [ScreenId.SKU_DETAIL]: ['V', 'E'],
    [ScreenId.CELL_LOTS_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.CELL_LOT_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.CELL_SERIALIZE]: ['V', 'X'],
    [ScreenId.CELL_SCAN_BIND]: ['V', 'X'],
    [ScreenId.LINEAGE_VIEW]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.MODULE_ASSEMBLY_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.MODULE_ASSEMBLY_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.PACK_ASSEMBLY_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.PACK_ASSEMBLY_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V', 'E'],
    [ScreenId.PROVISIONING]: ['V'],
    [ScreenId.INVENTORY]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
  },

  // C3: Quality - Testing & Approval
  C3: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.SKU_LIST]: ['V'],
    [ScreenId.SKU_DETAIL]: ['V'],
    [ScreenId.CELL_LOTS_LIST]: ['V'],
    [ScreenId.CELL_LOT_DETAIL]: ['V'],
    [ScreenId.CELL_SCAN_BIND]: ['V', 'X'],
    [ScreenId.LINEAGE_VIEW]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'A'],
    [ScreenId.MODULE_ASSEMBLY_LIST]: ['V'],
    [ScreenId.PACK_ASSEMBLY_LIST]: ['V'],
    [ScreenId.PACK_ASSEMBLY_DETAIL]: ['V', 'E', 'A'],
    [ScreenId.EOL_QA_STATION]: ['V', 'C', 'E', 'A', 'X'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
  },

  // C4: Engineering/IT - Admin & Config
  C4: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.SKU_LIST]: ['V', 'E'],
    [ScreenId.SKU_DETAIL]: ['V', 'E'],
    [ScreenId.CELL_LOTS_LIST]: ['V'],
    [ScreenId.SETTINGS]: ['V', 'M'],
    [ScreenId.RBAC_VIEW]: ['V', 'M'],
  },

  // C5: BMS/Firmware - Deep tech view
  C5: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.SKU_LIST]: ['V', 'E'],
    [ScreenId.SKU_DETAIL]: ['V', 'E'],
    [ScreenId.TELEMETRY]: ['V', 'X', 'M'],
    [ScreenId.PROVISIONING]: ['V', 'C', 'E', 'X', 'A'],
  },

  // C6: Logistics
  C6: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.CELL_LOTS_LIST]: ['V', 'C', 'E'],
    [ScreenId.CELL_LOT_DETAIL]: ['V', 'E'],
    [ScreenId.INVENTORY]: ['V', 'C', 'E', 'M', 'X'],
    [ScreenId.DISPATCH_LIST]: ['V', 'C', 'E', 'X', 'A'],
    [ScreenId.CUSTODY]: ['V', 'C', 'A'],
  },

  // C7: Warranty
  C7: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.LINEAGE_VIEW]: ['V'],
    [ScreenId.WARRANTY]: ['V', 'C', 'E', 'A', 'X', 'M'],
  },

  // C8: Compliance
  C8: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.SKU_LIST]: ['V'],
    [ScreenId.CELL_LOTS_LIST]: ['V'],
    [ScreenId.LINEAGE_VIEW]: ['V'],
    [ScreenId.COMPLIANCE]: ['V', 'C', 'A', 'M'],
  },

  // C9: External
  C9: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.SKU_LIST]: ['V'],
    [ScreenId.CUSTODY]: ['V', 'C', 'E', 'A'],
    [ScreenId.WARRANTY]: ['V', 'C'],
  }
};
