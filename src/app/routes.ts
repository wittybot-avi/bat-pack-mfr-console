/**
 * Global Route Constants
 */
export const ROUTES = {
  DASHBOARD: '/',
  LOGIN: '/login',
  
  // SOP Guide
  RUNBOOKS: '/runbooks',
  RUNBOOK_DETAIL: '/runbooks/:runbookId',
  
  // Observe
  TELEMETRY: '/telemetry',
  ANALYTICS: '/analytics',
  
  // Design
  SKU_DESIGN: '/manufacturing/sku-design',
  SKU_DETAIL: '/manufacturing/sku-design/:id',
  
  // Trace
  CELL_SERIALIZATION: '/trace/cells',
  CELL_SERIALIZATION_HAPPY: '/trace/cells/lot-happy',
  CELL_SERIALIZATION_NEW: '/trace/cells/new',
  CELL_LOT_DETAIL: '/trace/cells/:lotId',
  LINEAGE_AUDIT: '/trace/lineage',
  LINEAGE_AUDIT_DETAIL: '/trace/lineage/:id',
  
  // Operate
  BATCHES: '/manufacturing/batches',
  BATCH_DETAIL: '/manufacturing/batches/:id',
  MODULE_ASSEMBLY: '/manufacturing/module-assembly',
  MODULE_ASSEMBLY_DETAIL: '/manufacturing/module-assembly/:id',
  PACK_ASSEMBLY: '/manufacturing/pack-assembly',
  PACK_ASSEMBLY_DETAIL: '/manufacturing/pack-assembly/:id',
  BATTERY_IDENTITY: '/manufacturing/battery-identity',
  BATTERY_IDENTITY_DETAIL: '/manufacturing/battery-identity/:id',
  
  PROVISIONING_QUEUE: '/manufacturing/provisioning/queue',
  PROVISIONING_SETUP: '/manufacturing/provisioning/setup',
  PROVISIONING_WORKSTATION: '/assure/provisioning/:batteryId',
  
  INVENTORY: '/inventory',
  DISPATCH_ORDERS: '/dispatch-orders',
  DISPATCH_DETAIL: '/dispatch-orders/:orderId',

  // Assure
  EOL_QUEUE: '/assure/eol/qa-queue',
  EOL_SETUP: '/assure/eol/station-setup',
  EOL_REVIEW: '/assure/eol/review',
  EOL_DETAILS: '/assure/eol/details/:buildId',
  EOL_RUN: '/assure/eol/run/:buildId',
  EOL_AUDIT: '/assure/eol/audit/:buildId',

  // Resolve
  WARRANTY_RETURNS: '/resolve/warranty-returns',
  WARRANTY_CLAIM_DETAIL: '/resolve/warranty-returns/claims/:claimId',
  WARRANTY_INTAKE: '/warranty/intake',

  // Govern
  COMPLIANCE: '/govern/compliance',
  CUSTODY: '/govern/chain-of-custody',
  CUSTODY_DETAIL: '/govern/chain-of-custody/:dispatchId',

  // Admin
  SETTINGS: '/admin/settings',
  ACCESS_AUDIT: '/admin/access-audit',

  // Diagnostics
  SYSTEM_HEALTH: '/diagnostics/system-health'
};