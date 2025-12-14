// Status Enums
export enum BatchStatus {
  DRAFT = 'Draft',
  IN_PRODUCTION = 'In Production',
  QA_PENDING = 'QA Pending',
  RELEASED = 'Released',
  COMPLETED = 'Completed'
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

// Domain Entities
export interface Batch {
  id: string;
  batchNumber: string;
  sku: string;
  quantity: number;
  produced: number;
  startDate: string;
  status: BatchStatus;
  supplierLots: string[]; // Mock IDs
  riskLevel: RiskLevel;
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