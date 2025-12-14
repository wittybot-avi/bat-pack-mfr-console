import { Batch, BatchStatus, Battery, BatteryStatus, KPIData, MovementOrder, RiskLevel, TelemetryPoint, SupplierLot, BatchNote, AssemblyEvent } from '../domain/types';

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
  getBatteries(filter?: any): Promise<Battery[]>;
  getBatteryById(id: string): Promise<Battery | undefined>;
  getBatteryTelemetry(id: string): Promise<TelemetryPoint[]>;
  
  // Lifecycle Actions
  registerBatteries(batchId: string, quantity: number, user: string): Promise<Battery[]>;
  addAssemblyEvent(id: string, event: Partial<AssemblyEvent>): Promise<Battery>;
  provisionBattery(id: string, data: { bmsUid: string, firmware: string, profile: string }): Promise<Battery>;
  uploadEOLResult(id: string, data: { soh: number, capacity: number, resistance: number, result: 'PASS'|'FAIL' }): Promise<Battery>;
  approveBattery(id: string, user: string): Promise<Battery>;
  dispatchBattery(id: string, location: string): Promise<Battery>;
  flagRework(id: string, notes: string, user: string): Promise<Battery>;
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

const generateBatteries = (count: number): Battery[] => {
    return Array.from({ length: count }).map((_, i) => {
        const batchId = `batch-${Math.floor(i / 10) + 1}`;
        const status = [BatteryStatus.ASSEMBLY, BatteryStatus.PROVISIONING, BatteryStatus.QA_TESTING, BatteryStatus.IN_INVENTORY, BatteryStatus.DEPLOYED][Math.floor(Math.random() * 5)];
        
        return {
            id: `batt-${i}`,
            serialNumber: `SN-${(100000 + i).toString(16).toUpperCase()}`,
            batchId: batchId,
            qrCode: `QR-${100000+i}`,
            plantId: 'PLANT-01',
            lineId: 'L1',
            stationId: 'ST-04',
            status: status as BatteryStatus,
            location: status === BatteryStatus.DEPLOYED ? 'Customer Site' : 'Warehouse A, Zone 2',
            lastSeen: new Date().toISOString(),
            manufacturedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
            
            assemblyEvents: [
                { id: `evt-${i}-1`, stationId: 'ST-01', operatorId: 'OP-55', eventType: 'Assembly Start', timestamp: new Date(Date.now() - 86400000).toISOString() }
            ],
            reworkFlag: Math.random() > 0.9,
            scrapFlag: false,
            
            provisioningStatus: status === BatteryStatus.ASSEMBLY ? 'PENDING' : 'PASS',
            cryptoProvisioned: status !== BatteryStatus.ASSEMBLY,
            firmwareVersion: status === BatteryStatus.ASSEMBLY ? undefined : 'v2.1.4',
            bmsUid: status === BatteryStatus.ASSEMBLY ? undefined : `BMS-${(5000+i)}`,
            
            soh: 95 + Math.random() * 5,
            soc: 30 + Math.random() * 60,
            voltage: 48 + Math.random(),
            eolResult: (status === BatteryStatus.IN_INVENTORY || status === BatteryStatus.DEPLOYED) ? 'PASS' : undefined,
            certificateRef: (status === BatteryStatus.IN_INVENTORY || status === BatteryStatus.DEPLOYED) ? `CERT-${i}` : undefined,
            
            notes: []
        };
    });
};

// Global mutable store for mocks
let MOCK_BATTERIES = generateBatteries(150);

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
  async getBatteries(filters?: any): Promise<Battery[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    let res = [...MOCK_BATTERIES];
    
    if (filters?.search) {
        const term = filters.search.toLowerCase();
        res = res.filter(b => b.serialNumber.toLowerCase().includes(term) || b.batchId.toLowerCase().includes(term));
    }
    if (filters?.status && filters.status !== 'All') {
        res = res.filter(b => b.status === filters.status);
    }
    if (filters?.eolResult && filters.eolResult !== 'All') {
        res = res.filter(b => b.eolResult === filters.eolResult);
    }
    
    return res;
  }

  async getBatteryById(id: string): Promise<Battery | undefined> {
    await new Promise(resolve => setTimeout(resolve, 300));
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
  
  async registerBatteries(batchId: string, quantity: number, user: string): Promise<Battery[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newBatteries: Battery[] = [];
    const startIndex = MOCK_BATTERIES.length;
    
    for (let i = 0; i < quantity; i++) {
        const idx = startIndex + i;
        newBatteries.push({
            id: `batt-${idx}`,
            serialNumber: `SN-${(100000 + idx).toString(16).toUpperCase()}`,
            batchId,
            qrCode: `QR-${100000+idx}`,
            plantId: 'PLANT-01',
            status: BatteryStatus.ASSEMBLY,
            location: 'Assembly Line 1',
            lastSeen: new Date().toISOString(),
            assemblyEvents: [],
            reworkFlag: false,
            scrapFlag: false,
            provisioningStatus: 'PENDING',
            cryptoProvisioned: false,
            soh: 100,
            soc: 0,
            notes: [{ id: Math.random().toString(), author: user, role: 'Creator', text: 'Registered', timestamp: new Date().toISOString() }]
        });
    }
    
    MOCK_BATTERIES = [...newBatteries, ...MOCK_BATTERIES];
    return newBatteries;
  }

  async addAssemblyEvent(id: string, event: Partial<AssemblyEvent>): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.assemblyEvents.push({
          id: Math.random().toString(),
          stationId: 'ST-XX',
          operatorId: 'OP-XX',
          eventType: 'Cell Stacking',
          timestamp: new Date().toISOString(),
          ...event
      } as AssemblyEvent);
      
      return batt;
  }

  async provisionBattery(id: string, data: { bmsUid: string, firmware: string, profile: string }): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 800));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.status = BatteryStatus.PROVISIONING;
      batt.bmsUid = data.bmsUid;
      batt.firmwareVersion = data.firmware;
      batt.calibrationProfile = data.profile;
      batt.provisioningStatus = 'PASS';
      batt.cryptoProvisioned = true;
      
      return batt;
  }

  async uploadEOLResult(id: string, data: { soh: number, capacity: number, resistance: number, result: 'PASS'|'FAIL' }): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 800));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");

      batt.status = BatteryStatus.QA_TESTING;
      batt.soh = data.soh;
      batt.capacityAh = data.capacity;
      batt.internalResistance = data.resistance;
      batt.eolResult = data.result;
      
      return batt;
  }

  async approveBattery(id: string, user: string): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      if (batt.eolResult !== 'PASS') throw new Error("Cannot approve battery that hasn't passed EOL");
      
      batt.status = BatteryStatus.IN_INVENTORY;
      batt.qaApproverId = user;
      batt.certificateRef = `CERT-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      return batt;
  }

  async dispatchBattery(id: string, location: string): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.status = BatteryStatus.IN_TRANSIT;
      batt.dispatchStatus = 'Shipped';
      batt.location = location;
      
      return batt;
  }
  
  async flagRework(id: string, notes: string, user: string): Promise<Battery> {
      await new Promise(resolve => setTimeout(resolve, 400));
      const batt = MOCK_BATTERIES.find(b => b.id === id);
      if (!batt) throw new Error("Not found");
      
      batt.reworkFlag = true;
      batt.notes.push({ id: Math.random().toString(), author: user, role: 'Operator', text: `REWORK FLAGGED: ${notes}`, timestamp: new Date().toISOString() });
      
      return batt;
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