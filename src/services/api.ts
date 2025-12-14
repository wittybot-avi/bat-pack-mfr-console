import { Batch, BatchStatus, Battery, BatteryStatus, KPIData, MovementOrder, RiskLevel, TelemetryPoint, SupplierLot, BatchNote } from '../domain/types';

/**
 * SERVICE INTERFACES
 * ---------------------------------------------------------------------
 */

export interface IBatchService {
  getBatches(filters?: any): Promise<Batch[]>;
  getBatchById(id: string): Promise<Batch | undefined>;
  createBatch(batch: Partial<Batch>): Promise<Batch>;
  updateBatch(id: string, updates: Partial<Batch>): Promise<Batch>;
  
  // Workflow Actions
  requestHold(id: string, reason: string, user: string): Promise<Batch>;
  approveHold(id: string, reason: string, user: string): Promise<Batch>;
  requestRelease(id: string, reason: string, user: string): Promise<Batch>;
  approveRelease(id: string, reason: string, user: string): Promise<Batch>;
  
  requestCloseByProd(id: string, user: string): Promise<Batch>;
  approveCloseByQA(id: string, user: string): Promise<Batch>;
  forceClose(id: string, user: string): Promise<Batch>;
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
    plantId: 'PLANT-01',
    lineId: i % 2 === 0 ? 'L1' : 'L2',
    shiftId: 'SHIFT-A',
    supervisorId: 'USER-101',
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    
    sku: i % 2 === 0 ? 'VV360-LFP-48V' : 'EE360-NMC-72V',
    packModelId: i % 2 === 0 ? 'VV360' : 'EE360',
    packVariant: 'Std',
    chemistry: i % 2 === 0 ? 'LFP' : 'NMC',
    seriesCount: 16,
    parallelCount: 2,
    nominalVoltageV: 48,
    capacityAh: 100,
    energyWh: 4800,
    targetQuantity: 100 + (i * 10),
    customerProgram: 'OEM-X',
    
    bomVersion: 'v1.2',
    cellSpec: 'CATL-100Ah',
    bmsSpec: 'Aayatana-BMS-v3',
    mechanicalsSpec: 'Alu-Case-Gen2',
    
    supplierLots: [
      { id: `lot-${i}-1`, lotType: 'Cell', supplierName: 'CATL', supplierLotId: `C-${i}99`, receivedDate: '2024-01-01', qtyConsumed: 1000 },
      { id: `lot-${i}-2`, lotType: 'BMS', supplierName: 'Texas Inst', supplierLotId: `TI-${i}22`, receivedDate: '2024-01-02', qtyConsumed: 100 }
    ],
    
    processRouteId: 'ROUTE-STD-01',
    stationRecipeVersion: 'REC-v4.0',
    startPlannedAt: new Date(Date.now() - i * 86400000).toISOString(),
    
    status: i === 0 ? BatchStatus.DRAFT : i < 5 ? BatchStatus.IN_PRODUCTION : BatchStatus.RELEASED_TO_INVENTORY,
    
    qtyStarted: 50 + i,
    qtyBuilt: 45 + i,
    qtyPassedEOL: 40 + i,
    qtyFailedEOL: 2,
    qtyReworked: 3,
    yieldPct: 90,
    eolPassRatePct: 95.5,
    riskLevel: i === 3 ? RiskLevel.HIGH : i === 7 ? RiskLevel.MEDIUM : RiskLevel.LOW,
    
    holdRequestPending: false,
    closeRequestByProd: false,
    closeApprovedByQA: false,
    
    notes: []
  }));
};

const MOCK_BATCHES = generateBatches(20);
// Add a few more supplier lots for demo
const MOCK_BATTERIES: Battery[] = Array.from({ length: 150 }).map((_, i) => ({
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

/**
 * MOCK IMPLEMENTATIONS
 * ---------------------------------------------------------------------
 */

class MockBatchService implements IBatchService {
  async getBatches(filters?: any): Promise<Batch[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    let res = [...MOCK_BATCHES];
    if (filters?.status) {
      res = res.filter(b => b.status === filters.status);
    }
    return res;
  }

  async getBatchById(id: string): Promise<Batch | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_BATCHES.find(b => b.id === id);
  }

  async createBatch(data: Partial<Batch>): Promise<Batch> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newBatch: Batch = {
      ...MOCK_BATCHES[0], // Copy defaults from first
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: BatchStatus.DRAFT,
      supplierLots: [],
      notes: [],
      holdRequestPending: false,
      closeRequestByProd: false,
      closeApprovedByQA: false,
      ...data
    } as Batch;
    MOCK_BATCHES.unshift(newBatch);
    return newBatch;
  }

  async updateBatch(id: string, updates: Partial<Batch>): Promise<Batch> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = MOCK_BATCHES.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Batch not found");
    
    MOCK_BATCHES[index] = { ...MOCK_BATCHES[index], ...updates };
    return MOCK_BATCHES[index];
  }

  // Workflow Actions
  async requestHold(id: string, reason: string, user: string): Promise<Batch> {
    return this.updateBatch(id, { 
      holdRequestPending: true,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Unknown',
        text: `Hold Requested: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Hold'
      }]
    });
  }

  async approveHold(id: string, reason: string, user: string): Promise<Batch> {
    return this.updateBatch(id, {
      status: BatchStatus.ON_HOLD,
      holdRequestPending: false,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Approver',
        text: `Hold Approved: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Hold'
      }]
    });
  }

  async requestRelease(id: string, reason: string, user: string): Promise<Batch> {
    return this.updateBatch(id, {
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Requester',
        text: `Release Requested: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Release'
      }]
    });
  }

  async approveRelease(id: string, reason: string, user: string): Promise<Batch> {
    // Return to IN_PRODUCTION or previous state logic (simplified here)
    return this.updateBatch(id, {
      status: BatchStatus.IN_PRODUCTION,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'Approver',
        text: `Release Approved: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'Release'
      }]
    });
  }

  async requestCloseByProd(id: string, user: string): Promise<Batch> {
    const batch = await this.getBatchById(id);
    let newStatus = batch?.status;
    if (batch?.closeApprovedByQA) newStatus = BatchStatus.CLOSED;

    return this.updateBatch(id, {
      closeRequestByProd: true,
      status: newStatus,
      notes: [...(batch?.notes || []), {
        id: Math.random().toString(),
        author: user,
        role: 'Production',
        text: 'Close Requested',
        timestamp: new Date().toISOString(),
        type: 'General'
      }]
    });
  }

  async approveCloseByQA(id: string, user: string): Promise<Batch> {
    const batch = await this.getBatchById(id);
    let newStatus = batch?.status;
    if (batch?.closeRequestByProd) newStatus = BatchStatus.CLOSED;

    return this.updateBatch(id, {
      closeApprovedByQA: true,
      status: newStatus,
      notes: [...(batch?.notes || []), {
        id: Math.random().toString(),
        author: user,
        role: 'QA',
        text: 'Close Approved',
        timestamp: new Date().toISOString(),
        type: 'General'
      }]
    });
  }

  async forceClose(id: string, user: string): Promise<Batch> {
    return this.updateBatch(id, {
      status: BatchStatus.CLOSED,
      notes: [...(await this.getBatchById(id))!.notes, {
        id: Math.random().toString(),
        author: user,
        role: 'SuperAdmin',
        text: 'Forced Close',
        timestamp: new Date().toISOString(),
        type: 'General'
      }]
    });
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