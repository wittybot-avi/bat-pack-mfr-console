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

export enum QaDisposition {
  PASS = 'PASS',
  FAIL = 'FAIL',
  HOLD = 'HOLD',
  REWORK = 'REWORK',
  SCRAP = 'SCRAP'
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
  
  // Lifecycle
  dispatchStatus?: 'Pending' | 'Ready' | 'Shipped';
  custodyStatus?: string;
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