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
  RETIRED = 'Retired'
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

export interface Battery {
  id: string; // Internal UUID
  serialNumber: string; // Human readable
  batchId: string;
  status: BatteryStatus;
  firmwareVersion: string;
  soh: number; // State of Health %
  soc: number; // State of Charge %
  location: string;
  manufacturingDate: string;
  lastSeen: string;
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