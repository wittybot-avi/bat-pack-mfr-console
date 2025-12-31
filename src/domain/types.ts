
// Status Enums
export enum BatchStatus {
  DRAFT = 'Draft',
  RELEASED_TO_PRODUCTION = 'Released to Production',
  IN_PRODUCTION = 'In Production',
  IN_EOL_TEST = 'In EOL Test',
  QA_REVIEW = 'QA Review',
  ON_HOLD = 'On Hold',
  RELEASED_TO_INVENTORY = 'Released to Inventory',
  DISPATCHED = 'Dispatched',
  CLOSED = 'Closed',
  SCRAPPED = 'Scrapped'
}

export enum BatteryStatus {
  ASSEMBLY = 'Assembly',
  PROVISIONING = 'Provisioning',
  QA_TESTING = 'QA Testing',
  IN_INVENTORY = 'In Inventory',
  IN_TRANSIT = 'In Transit',
  DEPLOYED = 'Deployed',
  RMA = 'RMA',
  RETIRED = 'Retired',
  SCRAPPED = 'Scrapped'
}

export enum InventoryStatus {
  PENDING_PUTAWAY = 'Pending Put-away',
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  QUARANTINED = 'Quarantined',
  DISPATCHED = 'Dispatched'
}

export enum DispatchStatus {
  DRAFT = 'Draft',
  READY = 'Ready',
  DISPATCHED = 'Dispatched',
  CANCELLED = 'Cancelled'
}

export enum CustodyStatus {
  AT_FACTORY = 'At Factory',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered', // Physical arrival
  ACCEPTED = 'Accepted',   // Signed off
  REJECTED = 'Rejected'    // Returned/Issue
}

export enum QaDisposition {
  PASS = 'PASS',
  FAIL = 'FAIL',
  HOLD = 'HOLD',
  REWORK = 'REWORK',
  SCRAP = 'SCRAP'
}

export enum ClaimStatus {
  OPEN = 'Open',
  UNDER_ANALYSIS = 'Under Analysis',
  AWAITING_EVIDENCE = 'Awaiting Evidence',
  DECIDED = 'Decided',
  CLOSED = 'Closed'
}

export enum ClaimPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum FailureCategory {
  MANUFACTURING_DEFECT = 'Manufacturing Defect',
  QA_ESCAPE = 'QA Escape',
  LOGISTICS_DAMAGE = 'Logistics Damage',
  FIELD_MISUSE = 'Field Misuse',
  AGING_WEAR = 'Aging / Wear',
  UNKNOWN = 'Unknown'
}

export enum ClaimDisposition {
  REPLACE = 'Replace',
  REPAIR = 'Repair',
  CREDIT = 'Credit',
  REJECT = 'Reject Claim',
  NO_FAULT_FOUND = 'No Fault Found',
  RECYCLE_FUTURE = 'Recycle (Future Credit)'
}

export enum LiabilityAttribution {
  MANUFACTURER = 'Manufacturer',
  LOGISTICS = 'Logistics Provider',
  CUSTOMER = 'Customer',
  UNKNOWN = 'Unknown'
}

export enum UserRole {
  MANUFACTURER_ADMIN = 'Manufacturer Admin',
  QA_ENGINEER = 'QA Engineer',
  LOGISTICS_OPERATOR = 'Logistics Operator'
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface SupplierLot {
  id: string;
  lotType: 'Cell' | 'BMS' | 'Housing' | 'Connector' | 'Other';
  supplierName: string;
  supplierLotId: string;
  receivedDate: string;
  qtyConsumed: number;
  notes?: string;
}

export interface BatchNote {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  type: 'General' | 'Hold' | 'Release' | 'Incident' | 'Discrepancy';
}

// Domain Entities
export interface Batch {
  id: string;
  
  // Header
  batchNumber: string;
  plantId: string;
  lineId: string;
  shiftId: string;
  supervisorId: string; // User ID
  createdBy: string;
  createdAt: string;
  
  // Product Spec
  sku: string;
  packModelId: string;
  packVariant: string;
  chemistry: 'LFP' | 'NMC' | 'LTO' | 'Na-Ion';
  seriesCount: number; // e.g., 16S
  parallelCount: number; // e.g., 2P
  nominalVoltageV: number;
  capacityAh: number;
  energyWh: number; // Derived
  targetQuantity: number;
  customerProgram?: string;
  intendedUse?: string;

  // BOM
  bomVersion: string;
  cellSpec: string;
  bmsSpec: string;
  mechanicalsSpec: string;

  // Supplier Lots
  supplierLots: SupplierLot[];

  // Process
  processRouteId: string;
  stationRecipeVersion: string;
  startPlannedAt: string;
  endPlannedAt?: string;

  // Status & Metrics
  status: BatchStatus;
  qtyStarted: number;
  qtyBuilt: number;
  qtyPassedEOL: number;
  qtyFailedEOL: number;
  qtyReworked: number;
  yieldPct: number;
  eolPassRatePct: number;
  riskLevel: RiskLevel;

  // Approval Flags (2-step workflows)
  holdRequestPending: boolean;
  closeRequestByProd: boolean;
  closeApprovedByQA: boolean;

  notes: BatchNote[];
}

export interface AssemblyEvent {
  id: string;
  stationId: string;
  operatorId: string;
  eventType: 'Assembly Start' | 'Cell Stacking' | 'Welding' | 'BMS Install' | 'Housing Close' | 'Rework';
  timestamp: string;
  details?: string;
}

export interface BatteryNote {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface ProvisioningLogEntry {
  id: string;
  timestamp: string;
  stationId: string;
  step: string;
  outcome: 'PASS' | 'FAIL' | 'INFO';
  operator: string;
  details?: string;
}

export interface EolMeasurements {
  voltage: number;
  capacityAh: number;
  internalResistance: number;
  temperatureMax: number;
  cellBalancingDelta: number;
  timestamp: string;
}

export interface EolLogEntry {
  id: string;
  timestamp: string;
  stationId: string;
  action: 'Test Run' | 'Disposition' | 'Certificate' | 'Override';
  outcome: string;
  operator: string;
  details?: string;
}

export interface InventoryMovementEntry {
  id: string;
  timestamp: string;
  type: 'PUT_AWAY' | 'MOVE' | 'RESERVE' | 'QUARANTINE' | 'RELEASE' | 'DISPATCH';
  fromLocation?: string;
  toLocation?: string;
  operator: string;
  details?: string;
}

export interface CustodyEvent {
  id: string;
  timestamp: string;
  status: CustodyStatus;
  location: string;
  handler: string;
  signature?: string;
  dispatchId?: string;
  notes?: string;
  reasonCode?: string;
}

export interface DispatchOrder {
  id: string;
  orderNumber: string; // DO-2024-XXXX
  status: DispatchStatus;
  custodyStatus?: CustodyStatus; // Aggregate state of the shipment
  
  // Header
  customerName: string;
  destinationAddress: string;
  expectedShipDate: string;
  carrierName?: string;
  transportMode?: 'Road' | 'Air' | 'Sea';
  
  // Contents
  batteryIds: string[];
  
  // Documents (Refs)
  packingListRef?: string;
  manifestRef?: string;
  invoiceRef?: string;
  
  // Meta
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  notes?: string;
}

export interface WarrantyClaim {
  claimId: string;
  batteryId: string;
  batchId?: string;
  customerName: string;
  
  status: ClaimStatus;
  priority: ClaimPriority;
  failureCategory: FailureCategory;
  symptoms: string;
  
  reportedAt: string;
  createdByRole: string;
  createdByName: string;
  
  assignedToRole?: string;
  assignedToName?: string;
  
  evidenceAttachments: Array<{
    id: string;
    fileName: string;
    type: 'PHOTO' | 'LOG' | 'PDF' | 'OTHER';
    uploadedAt: string;
    notes?: string;
  }>;
  
  rca?: {
    suspectedCause: FailureCategory;
    contributingFactors: string[];
    analystNotes: string;
    analyzedAt: string;
    analyzedBy: string;
  };
  
  references?: {
    telemetryRef?: string;
    qaRef?: string;
    custodyRef?: string;
  };
  
  disposition?: ClaimDisposition;
  liabilityAttribution?: LiabilityAttribution;
  decisionNotes?: string;
  decidedAt?: string;
  decidedBy?: string;
  
  closedAt?: string;
  closureNotes?: string;
}

export interface Battery {
  id: string; // Internal UUID
  
  // Identity
  serialNumber: string; // Human readable
  batchId: string;
  qrCode: string;
  manufacturedAt?: string;
  plantId: string;
  lineId?: string;
  stationId?: string;
  
  // Status
  status: BatteryStatus;
  location: string;
  lastSeen: string;
  
  // Assembly
  assemblyEvents: AssemblyEvent[];
  reworkFlag: boolean;
  scrapFlag: boolean;
  
  // Provisioning & BMS
  bmsUid?: string;
  firmwareVersion?: string;
  calibrationProfile?: string;
  calibrationStatus?: 'PENDING' | 'PASS' | 'FAIL';
  cryptoProvisioned: boolean;
  provisioningStatus: 'PENDING' | 'PASS' | 'FAIL';
  provisioningLogs?: ProvisioningLogEntry[];
  
  // EOL / QA
  eolStatus?: 'NOT_TESTED' | 'IN_TEST' | 'PASS' | 'FAIL';
  eolMeasurements?: EolMeasurements;
  eolLog?: EolLogEntry[];
  
  // Legacy fields (kept for compatibility, can sync with eolMeasurements)
  soh: number; // State of Health %
  soc: number; // State of Charge %
  voltage?: number;
  capacityAh?: number;
  internalResistance?: number;
  thermalResult?: 'PASS' | 'FAIL';
  
  eolResult?: 'PASS' | 'FAIL'; // High level result
  qaDisposition?: QaDisposition;
  qaApproverId?: string;
  qaApprovedAt?: string;
  certificateRef?: string;

  // Inventory & Logistics
  releaseToInventory?: boolean;
  inventoryStatus?: InventoryStatus;
  inventoryLocation?: string; // e.g. WH1-Z2-R04-B10
  inventoryEnteredAt?: string;
  inventoryMovementLog?: InventoryMovementEntry[];
  
  reservedAt?: string;
  reservedBy?: string;
  dispatchId?: string;
  
  // Lifecycle
  dispatchStatus?: 'Pending' | 'Ready' | 'Shipped'; // Legacy
  custodyStatus?: CustodyStatus;
  custodyLog?: CustodyEvent[];
  returnReason?: string;
  
  notes: BatteryNote[];
}

export interface TelemetryPoint {
  timestamp: number;
  voltage: number;
  current: number;
  temperature: number;
  soc: number;
  cellMaxVol: number;
  cellMinVol: number;
}

export interface MovementOrder {
  id: string;
  trackingId: string;
  destination: string;
  status: 'Planning' | 'Ready' | 'In Transit' | 'Delivered';
  itemCount: number;
  eta: string;
}

export interface KPIData {
  totalBatteries: number;
  activeBatches: number;
  eolPassRate: number;
  exceptions: number;
  inTransit: number;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  batteryId?: string;
}

/**
 * MODULE & PACK ASSEMBLY TYPES (Patch C + E)
 * ---------------------------------------------------------------------
 */

export enum ModuleStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SEALED = 'SEALED',
  CONSUMED = 'CONSUMED',
  QUARANTINED = 'QUARANTINED'
}

export enum PackStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  FINALIZED = 'FINALIZED',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

export interface ModuleInstance {
  id: string;
  skuId: string;
  skuCode: string;
  targetCells: number;
  boundCellSerials: string[];
  status: ModuleStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  actor?: string;
}

export interface PackInstance {
  id: string;
  skuId: string;
  skuCode: string;
  moduleIds: string[];
  status: PackStatus;
  packSerial: string;
  bmsSerial: string;
  firmwareVersion: string;
  qcStatus: 'PENDING' | 'PASSED' | 'FAILED';
  destination?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CellBindingRecord {
  moduleId: string;
  serial: string;
  lotId: string;
  lotCode: string;
  boundAt: string;
  actor: string;
  chemistry: string;
}

export interface ExceptionRecord {
  id: string;
  entityType: 'module' | 'pack' | 'lot';
  entityId: string;
  severity: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
  message: string;
  createdAt: string;
  actor: string;
}

/**
 * CELL TRACEABILITY & SERIALIZATION TYPES (Patch D)
 * ---------------------------------------------------------------------
 */

export type CellLotStatus = 'DRAFT' | 'SERIALIZED' | 'EXPORTED' | 'SCANNED' | 'READY_TO_BIND' | 'PUBLISHED' | 'CLOSED';
export type CellSerialStatus = 'GENERATED' | 'SCANNED' | 'BOUND' | 'QUARANTINED' | 'SCRAPPED';

export interface CellSerialRecord {
  serial: string;
  lotId: string;
  status: CellSerialStatus;
  generatedAt: string;
  scannedAt?: string;
  exportedAt?: string;
  actor?: string;
  metadata?: Record<string, any>;
}

export interface CellLot {
  id: string;
  lotCode: string;
  supplierName: string;
  supplierLotNo: string;
  chemistry: 'LFP' | 'NMC' | 'LTO' | 'Na-Ion';
  formFactor: 'Prismatic' | 'Cylindrical' | 'Pouch';
  capacityAh: number;
  receivedDate: string;
  quantityReceived: number;
  status: CellLotStatus;
  notes?: string;
  updatedAt: string;
  createdAt: string;
  // Stats
  generatedCount: number;
  scannedCount: number;
  boundCount: number;
}
