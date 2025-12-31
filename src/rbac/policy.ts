
import { ScreenId } from './screenIds';
import { PermissionVerb } from './verbs';

// Fix: Add missing PolicyMap type definition
export type PolicyMap = Record<string, Partial<Record<ScreenId, PermissionVerb[]>>>;

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
    [ScreenId.TELEMETRY_HISTORY_VIEW]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.EOL_QA_STATION]: ['V'],
    [ScreenId.EOL_QA_DETAIL]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.COMPLIANCE_OVERVIEW_TAB]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.WARRANTY_OVERVIEW]: ['V'],
    [ScreenId.SETTINGS]: ['V'],
    [ScreenId.SETTINGS_PROFILE]: ['V'],
  },

  // C2: Manufacturing - Shopfloor execution (Production Manager Role)
  C2: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_PRODUCTION]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V', 'C', 'E'],
    [ScreenId.BATCHES_CREATE]: ['C'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E'],
    [ScreenId.MODULE_ASSEMBLY_LIST]: ['V', 'C', 'E'],
    [ScreenId.MODULE_ASSEMBLY_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.PACK_ASSEMBLY_LIST]: ['V', 'C', 'E'],
    [ScreenId.PACK_ASSEMBLY_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.BATTERIES_LIST]: ['V', 'C'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.EOL_QA_STATION]: ['V'],
    [ScreenId.EOL_QA_DETAIL]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
  },

  // C3: Quality - Testing & Approval
  C3: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_QUALITY]: ['V'],
    [ScreenId.DASHBOARD_RISK_COMPLIANCE]: ['V'],
    [ScreenId.PACK_ASSEMBLY_LIST]: ['V'],
    [ScreenId.PACK_ASSEMBLY_DETAIL]: ['V', 'E', 'A'],
    [ScreenId.EOL_QA_STATION]: ['V', 'C', 'E', 'A', 'X'],
    [ScreenId.EOL_QA_DETAIL]: ['V', 'E', 'A', 'X'],
    [ScreenId.COMPLIANCE]: ['V', 'C', 'E'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FINDINGS_TAB]: ['V', 'C', 'E'],
    [ScreenId.WARRANTY]: ['V', 'E'],
  },
  
  // C6: Logistics
  C6: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_LOGISTICS]: ['V'],
    [ScreenId.INVENTORY]: ['V', 'E', 'X'],
    [ScreenId.DISPATCH_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.DISPATCH_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.CUSTODY]: ['V', 'X'],
    [ScreenId.CUSTODY_LIST]: ['V'],
    [ScreenId.CUSTODY_RECEIVE_ACTION]: ['X'],
  }
};
