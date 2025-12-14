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
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.INVENTORY]: ['V'],
    [ScreenId.DISPATCH]: ['V'],
    [ScreenId.EOL_QA]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.CUSTODY]: ['V'],
    [ScreenId.SETTINGS]: ['V'],
    [ScreenId.RBAC_VIEW]: ['V'],
  },

  // C2: Manufacturing - Shopfloor execution
  C2: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.BATCHES_CREATE]: ['C'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V', 'E'],
    [ScreenId.INVENTORY]: ['V'], // Can view inventory to find parts
  },

  // C3: QA - Testing & Approval
  C3: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'A'], // QA Edit/Approve
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.EOL_QA]: ['V', 'C', 'E', 'A', 'X'], // Full control of QA
    [ScreenId.ANALYTICS]: ['V'],
  },

  // C4: Engineering/IT - Admin & Config
  C4: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.SETTINGS]: ['V', 'M'],
    [ScreenId.RBAC_VIEW]: ['V', 'M'],
    [ScreenId.PROVISIONING]: ['V'],
    [ScreenId.PROVISIONING_STATION_SETUP]: ['V', 'E', 'M'],
  },

  // C5: BMS/Firmware - Deep tech view
  C5: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.TELEMETRY]: ['V', 'X', 'M'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V', 'E'], // Update firmware
    [ScreenId.PROVISIONING]: ['V', 'C', 'E', 'X', 'A'],
  },

  // C6: Logistics - Move stuff
  C6: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'], // Added access
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'X'], // Edit Suppliers, Export
    [ScreenId.INVENTORY]: ['V', 'C', 'E', 'M'],
    [ScreenId.DISPATCH]: ['V', 'C', 'E', 'X'],
    [ScreenId.CUSTODY]: ['V', 'C', 'A'],
    [ScreenId.BATTERIES_LIST]: ['V'],
  },

  // C7: Warranty
  C7: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.WARRANTY]: ['V', 'C', 'E', 'A'],
    [ScreenId.BATTERIES_DETAIL]: ['V'], // Trace history
    [ScreenId.TELEMETRY]: ['V'], // Debug
    [ScreenId.BATCHES_LIST]: ['V'], // Reference checks
    [ScreenId.BATCHES_DETAIL]: ['V'],
  },

  // C8: Compliance
  C8: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.COMPLIANCE]: ['V', 'C', 'A', 'M'],
    [ScreenId.CUSTODY]: ['V'], // Audit custody
    [ScreenId.RBAC_VIEW]: ['V'], // Audit access
    [ScreenId.BATCHES_LIST]: ['V'], // Audit batches
    [ScreenId.BATCHES_DETAIL]: ['V'],
  },

  // C9: External
  C9: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V'], // Limited View
    [ScreenId.BATCHES_DETAIL]: ['V', 'X'], // Limited Detail + Export Certs
    [ScreenId.DISPATCH]: ['V'], // Track my order
    [ScreenId.CUSTODY]: ['V', 'A'], // Ack receipt
  }
};