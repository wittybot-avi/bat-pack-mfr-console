import { Batch, BatchStatus, Battery, BatteryStatus, KPIData, MovementOrder, RiskLevel, TelemetryPoint } from '../domain/types';

/**
 * SERVICE INTERFACES
 * ---------------------------------------------------------------------
 * These interfaces define the contract for the UI.
 * In the future, real HTTP services will implement these interfaces.
 */

export interface IBatchService {
  getBatches(): Promise<Batch[]>;
  getBatchById(id: string): Promise<Batch | undefined>;
  createBatch(batch: Partial<Batch>): Promise<Batch>;
}

export interface IBatteryService {
  getBatteries(filter?: string): Promise<Battery[]>;
  getBatteryById(id: string): Promise<Battery | undefined>;
  getBatteryTelemetry(id: string): Promise<TelemetryPoint[]>;
  registerBattery(battery: Partial<Battery>): Promise<Battery>;
}

export interface IDashboardService {
  getKPIs(): Promise<KPIData>;
  getRecentAlerts(): Promise<any[]>;
}

/**
 * MOCK DATA GENERATORS
 * ---------------------------------------------------------------------
 */
const generateBatches = (count: number): Batch[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `batch-${i + 1}`,
    batchNumber: `B-${2024000 + i}`,
    sku: i % 2 === 0 ? 'VV360-LFP-48V' : 'EE360-NMC-72V',
    quantity: 100 + (i * 10),
    produced: 50 + (i * 5),
    startDate: new Date(Date.now() - i * 86400000).toISOString(),
    status: i === 0 ? BatchStatus.DRAFT : i < 5 ? BatchStatus.IN_PRODUCTION : BatchStatus.RELEASED,
    supplierLots: ['L-9982', 'L-1234'],
    riskLevel: i === 3 ? RiskLevel.HIGH : i === 7 ? RiskLevel.MEDIUM : RiskLevel.LOW
  }));
};

const generateBatteries = (count: number): Battery[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `batt-${i}`,
    serialNumber: `SN-${(100000 + i).toString(16).toUpperCase()}`,
    batchId: `batch-${Math.floor(i / 20) + 1}`,
    status: [BatteryStatus.ASSEMBLY, BatteryStatus.QA_TESTING, BatteryStatus.IN_INVENTORY, BatteryStatus.DEPLOYED][Math.floor(Math.random() * 4)],
    firmwareVersion: 'v2.1.4',
    soh: 95 + Math.random() * 5,
    soc: 30 + Math.random() * 60,
    location: i % 3 === 0 ? 'Warehouse A, Zone 2' : 'Assembly Line 1',
    manufacturingDate: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
    lastSeen: new Date().toISOString()
  }));
};

const MOCK_BATCHES = generateBatches(20);
const MOCK_BATTERIES = generateBatteries(150);

/**
 * MOCK IMPLEMENTATIONS
 * ---------------------------------------------------------------------
 * Integration Note: Replace these classes with Http*Service classes
 * that use axios or fetch to call the backend API.
 */

class MockBatchService implements IBatchService {
  async getBatches(): Promise<Batch[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return [...MOCK_BATCHES];
  }

  async getBatchById(id: string): Promise<Batch | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_BATCHES.find(b => b.id === id);
  }

  async createBatch(data: Partial<Batch>): Promise<Batch> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newBatch: Batch = {
      id: `batch-${MOCK_BATCHES.length + 1}`,
      batchNumber: data.batchNumber || 'NEW-000',
      sku: data.sku || 'UNKNOWN',
      quantity: data.quantity || 0,
      produced: 0,
      startDate: new Date().toISOString(),
      status: BatchStatus.DRAFT,
      supplierLots: [],
      riskLevel: RiskLevel.LOW,
      ...data
    } as Batch;
    MOCK_BATCHES.unshift(newBatch);
    return newBatch;
  }
}

class MockBatteryService implements IBatteryService {
  async getBatteries(filter?: string): Promise<Battery[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!filter) return MOCK_BATTERIES;
    return MOCK_BATTERIES.filter(b => 
      b.serialNumber.toLowerCase().includes(filter.toLowerCase()) || 
      b.status.toLowerCase().includes(filter.toLowerCase())
    );
  }

  async getBatteryById(id: string): Promise<Battery | undefined> {
    return MOCK_BATTERIES.find(b => b.id === id);
  }

  async getBatteryTelemetry(id: string): Promise<TelemetryPoint[]> {
    // Generate 60 points of history
    const now = Date.now();
    return Array.from({ length: 60 }).map((_, i) => ({
      timestamp: now - ((59 - i) * 1000),
      voltage: 48 + Math.random() * 2,
      current: 10 + Math.random() * 5,
      temperature: 25 + Math.random() * 5,
      soc: 80 - (i * 0.01), // Slowly draining
      cellMaxVol: 3.6,
      cellMinVol: 3.4
    }));
  }
  
  async registerBattery(data: Partial<Battery>): Promise<Battery> {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Implementation stub
    return MOCK_BATTERIES[0];
  }
}

class MockDashboardService implements IDashboardService {
  async getKPIs(): Promise<KPIData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      totalBatteries: MOCK_BATTERIES.length,
      activeBatches: MOCK_BATCHES.filter(b => b.status === BatchStatus.IN_PRODUCTION).length,
      eolPassRate: 98.4,
      exceptions: 3,
      inTransit: 42
    };
  }

  async getRecentAlerts(): Promise<any[]> {
    return [
      { id: '1', severity: 'critical', message: 'Temp spike detected in Batch B-2024003', timestamp: '2 mins ago' },
      { id: '2', severity: 'warning', message: 'Low inventory for Cell-18650-Samsung', timestamp: '1 hour ago' },
    ];
  }
}

// Export Singleton Instances
export const batchService = new MockBatchService();
export const batteryService = new MockBatteryService();
export const dashboardService = new MockDashboardService();