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
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.ANALYTICS_BATCH_TAB]: ['V'],
    [ScreenId.ANALYTICS_STATION_TAB]: ['V'],
    [ScreenId.ANALYTICS_QUALITY_TAB]: ['V'],
    [ScreenId.ANALYTICS_LOCATION_TAB]: ['V'],
    [ScreenId.ANALYTICS_REPORTS_TAB]: ['V'],
    [ScreenId.ANALYTICS_EXPORT]: ['X'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.INVENTORY]: ['V'],
    [ScreenId.DISPATCH]: ['V'],
    [ScreenId.DISPATCH_LIST]: ['V'],
    [ScreenId.DISPATCH_DETAIL]: ['V'],
    [ScreenId.EOL_QA_STATION]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.WARRANTY_OVERVIEW]: ['V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V'],
    [ScreenId.WARRANTY_CLAIM_DETAIL]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.COMPLIANCE_OVERVIEW_TAB]: ['V'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FINDINGS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FUTURE_TAB]: ['V'],
    [ScreenId.COMPLIANCE_DPP_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_SUSTAINABILITY_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_RECYCLING_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_EXPORT]: ['X'],
    [ScreenId.CUSTODY]: ['V'],
    [ScreenId.CUSTODY_OVERVIEW]: ['V'],
    [ScreenId.CUSTODY_EXCEPTIONS]: ['V'],
    [ScreenId.SETTINGS]: ['V'],
    [ScreenId.RBAC_VIEW]: ['V'],
  },

  // C2: Manufacturing - Shopfloor execution
  C2: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_PRODUCTION]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.TELEMETRY_LIVE_VIEW]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.ANALYTICS_BATCH_TAB]: ['V'],
    [ScreenId.ANALYTICS_STATION_TAB]: ['V'],
    [ScreenId.BATCHES_LIST]: ['V', 'C', 'E', 'X'],
    [ScreenId.BATCHES_CREATE]: ['C'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'X'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V', 'E'],
    [ScreenId.PROVISIONING]: ['V'], // Read only access to console to see status
    [ScreenId.INVENTORY]: ['V'], // Can view inventory to find parts
    [ScreenId.DISPATCH_LIST]: ['V'],
    [ScreenId.DISPATCH_DETAIL]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.COMPLIANCE_OVERVIEW_TAB]: ['V'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V'],
    [ScreenId.WARRANTY_CLAIM_DETAIL]: ['V'],
    [ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL]: ['E'], // Add comments/evidence
  },

  // C3: QA - Testing & Approval
  C3: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_QUALITY]: ['V'],
    [ScreenId.DASHBOARD_RISK_COMPLIANCE]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.TELEMETRY_LIVE_VIEW]: ['V'],
    [ScreenId.TELEMETRY_HISTORY_VIEW]: ['V'],
    [ScreenId.TELEMETRY_EXPORT]: ['X'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.ANALYTICS_QUALITY_TAB]: ['V'],
    [ScreenId.ANALYTICS_BATCH_TAB]: ['V'],
    [ScreenId.ANALYTICS_STATION_TAB]: ['V'],
    [ScreenId.ANALYTICS_REPORTS_TAB]: ['V'],
    [ScreenId.ANALYTICS_EXPORT]: ['X'],
    [ScreenId.BATCHES_LIST]: ['V'],
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'A'], // QA Edit/Approve
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V'],
    [ScreenId.EOL_QA_STATION]: ['V', 'C', 'E', 'A', 'X'], // Full control of QA
    [ScreenId.EOL_QA_STATION_SETUP]: ['V', 'E', 'M'],
    [ScreenId.EOL_QA_REVIEW]: ['V', 'A'],
    [ScreenId.INVENTORY]: ['V', 'E'], // QA can Quarantine/Release
    [ScreenId.DISPATCH_LIST]: ['V'], // QA audits shipments
    [ScreenId.DISPATCH_DETAIL]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FINDINGS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V'],
    [ScreenId.WARRANTY_CLAIM_DETAIL]: ['V'],
    [ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL]: ['E'], // Add comments/evidence
  },

  // C4: Engineering/IT - Admin & Config
  C4: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_PRODUCTION]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.TELEMETRY_LIVE_VIEW]: ['V'],
    [ScreenId.TELEMETRY_HISTORY_VIEW]: ['V'],
    [ScreenId.SETTINGS]: ['V', 'M'],
    [ScreenId.RBAC_VIEW]: ['V', 'M'],
    [ScreenId.PROVISIONING]: ['V'],
    [ScreenId.PROVISIONING_STATION_SETUP]: ['V', 'E', 'M'],
    [ScreenId.EOL_QA_STATION]: ['V'],
    [ScreenId.EOL_QA_STATION_SETUP]: ['V', 'E', 'M'],
    [ScreenId.INVENTORY]: ['V'],
  },

  // C5: BMS/Firmware - Deep tech view
  C5: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_PRODUCTION]: ['V'],
    [ScreenId.TELEMETRY]: ['V', 'X', 'M'],
    [ScreenId.TELEMETRY_LIVE_VIEW]: ['V'],
    [ScreenId.TELEMETRY_HISTORY_VIEW]: ['V'],
    [ScreenId.TELEMETRY_EXPORT]: ['X'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.BATTERIES_DETAIL]: ['V', 'E'], // Update firmware
    [ScreenId.PROVISIONING]: ['V', 'C', 'E', 'X', 'A'],
    [ScreenId.EOL_QA_STATION]: ['V'], // View EOL results
  },

  // C6: Logistics - Move stuff
  C6: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_LOGISTICS]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.ANALYTICS_LOCATION_TAB]: ['V'],
    [ScreenId.ANALYTICS_REPORTS_TAB]: ['V'],
    [ScreenId.ANALYTICS_EXPORT]: ['X'],
    [ScreenId.BATCHES_LIST]: ['V'], // Added access
    [ScreenId.BATCHES_DETAIL]: ['V', 'E', 'X'], // Edit Suppliers, Export
    [ScreenId.INVENTORY]: ['V', 'C', 'E', 'M', 'X'], // Full inventory control
    [ScreenId.DISPATCH]: ['V', 'C', 'E', 'X'],
    [ScreenId.DISPATCH_LIST]: ['V', 'C', 'E', 'X', 'A'], // Full dispatch control
    [ScreenId.DISPATCH_DETAIL]: ['V', 'C', 'E', 'X', 'A'],
    [ScreenId.CUSTODY]: ['V', 'C', 'A'],
    [ScreenId.CUSTODY_OVERVIEW]: ['V'],
    [ScreenId.CUSTODY_LIST]: ['V'],
    [ScreenId.CUSTODY_DETAIL]: ['V'],
    [ScreenId.BATTERIES_LIST]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V'], // Logistics checks
    [ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V'],
    [ScreenId.WARRANTY_CLAIM_DETAIL]: ['V'],
  },

  // C7: Warranty
  C7: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_RISK_COMPLIANCE]: ['V'],
    [ScreenId.DASHBOARD_QUALITY]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.TELEMETRY_HISTORY_VIEW]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.ANALYTICS_QUALITY_TAB]: ['V'],
    [ScreenId.ANALYTICS_LOCATION_TAB]: ['V'],
    [ScreenId.ANALYTICS_REPORTS_TAB]: ['V'],
    [ScreenId.WARRANTY]: ['V', 'C', 'E', 'A', 'X', 'M'], // Full Warranty Control
    [ScreenId.WARRANTY_OVERVIEW]: ['V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V'],
    [ScreenId.WARRANTY_CLAIM_DETAIL]: ['V', 'E'],
    [ScreenId.WARRANTY_CREATE_CLAIM_INTERNAL]: ['C'],
    [ScreenId.WARRANTY_UPDATE_CLAIM_INTERNAL]: ['E'],
    [ScreenId.WARRANTY_DECIDE_DISPOSITION]: ['A'],
    [ScreenId.WARRANTY_CLOSE_CLAIM]: ['X'],
    [ScreenId.WARRANTY_EXPORT]: ['X'],
    [ScreenId.BATTERIES_DETAIL]: ['V'], // Trace history
    [ScreenId.BATCHES_LIST]: ['V'], // Reference checks
    [ScreenId.BATCHES_DETAIL]: ['V'],
    [ScreenId.EOL_QA_STATION]: ['V'], // Check test data
    [ScreenId.INVENTORY]: ['V'],
    [ScreenId.DISPATCH_LIST]: ['V'],
    [ScreenId.COMPLIANCE]: ['V'],
    [ScreenId.COMPLIANCE_OVERVIEW_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FINDINGS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB]: ['V'],
    [ScreenId.COMPLIANCE_EVIDENCE_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FUTURE_TAB]: ['V'],
    [ScreenId.COMPLIANCE_DPP_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_RECYCLING_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_EXPORT]: ['X'],
    [ScreenId.CUSTODY]: ['V'],
    [ScreenId.CUSTODY_LIST]: ['V'],
    [ScreenId.CUSTODY_DETAIL]: ['V'],
    [ScreenId.CUSTODY_EXCEPTIONS]: ['V'],
  },

  // C8: Compliance
  C8: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'],
    [ScreenId.DASHBOARD_RISK_COMPLIANCE]: ['V'],
    [ScreenId.TELEMETRY]: ['V'],
    [ScreenId.ANALYTICS]: ['V'],
    [ScreenId.ANALYTICS_OVERVIEW_TAB]: ['V'],
    [ScreenId.ANALYTICS_LOCATION_TAB]: ['V'],
    [ScreenId.ANALYTICS_REPORTS_TAB]: ['V'],
    [ScreenId.ANALYTICS_EXPORT]: ['X'],
    [ScreenId.COMPLIANCE]: ['V', 'C', 'A', 'M'],
    [ScreenId.COMPLIANCE_OVERVIEW_TAB]: ['V'],
    [ScreenId.COMPLIANCE_CHECKS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FINDINGS_TAB]: ['V'],
    [ScreenId.COMPLIANCE_EVIDENCE_TAB]: ['V'],
    [ScreenId.COMPLIANCE_AUDIT_TRAIL_TAB]: ['V'],
    [ScreenId.COMPLIANCE_FUTURE_TAB]: ['V'],
    [ScreenId.COMPLIANCE_DPP_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_SUSTAINABILITY_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_RECYCLING_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_REG_EXPORT_PREVIEW]: ['V'],
    [ScreenId.COMPLIANCE_EXPORT]: ['X'],
    [ScreenId.COMPLIANCE_FINDINGS_EDIT]: ['C', 'E', 'X'],
    [ScreenId.CUSTODY]: ['V'],
    [ScreenId.CUSTODY_OVERVIEW]: ['V'],
    [ScreenId.CUSTODY_LIST]: ['V'],
    [ScreenId.CUSTODY_DETAIL]: ['V'],
    [ScreenId.CUSTODY_EXPORT]: ['X'],
    [ScreenId.RBAC_VIEW]: ['V'], // Audit access
    [ScreenId.BATCHES_LIST]: ['V'], // Audit batches
    [ScreenId.BATCHES_DETAIL]: ['V'],
    [ScreenId.INVENTORY]: ['V'],
    [ScreenId.DISPATCH_LIST]: ['V'],
    [ScreenId.WARRANTY]: ['V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V'],
    [ScreenId.WARRANTY_CLAIM_DETAIL]: ['V'],
    [ScreenId.WARRANTY_EXPORT]: ['X'],
  },

  // C9: External
  C9: {
    [ScreenId.DASHBOARD]: ['V'],
    [ScreenId.DASHBOARD_EXEC_SUMMARY]: ['V'], // Limited summary only
    [ScreenId.BATCHES_LIST]: ['V'], // Limited View
    [ScreenId.BATCHES_DETAIL]: ['V', 'X'], // Limited Detail + Export Certs
    [ScreenId.DISPATCH]: ['V'], // Track my order
    [ScreenId.CUSTODY]: ['V', 'C', 'E', 'A'], // Full actions on own shipments
    [ScreenId.CUSTODY_LIST]: ['V'],
    [ScreenId.CUSTODY_DETAIL]: ['V'],
    [ScreenId.CUSTODY_RECEIVE_ACTION]: ['X'],
    [ScreenId.CUSTODY_ACCEPT_REJECT_ACTION]: ['X'],
    [ScreenId.CUSTODY_EXCEPTIONS]: ['V'],
    [ScreenId.WARRANTY]: ['V', 'C'],
    [ScreenId.WARRANTY_EXTERNAL_INTAKE]: ['C', 'V'],
    [ScreenId.WARRANTY_CLAIMS_LIST]: ['V'],
    [ScreenId.WARRANTY_CLAIM_DETAIL]: ['V'], // View own claims status
  }
};