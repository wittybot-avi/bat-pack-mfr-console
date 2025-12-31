
import { safeStorage } from '../utils/safeStorage';
import { EolTestRun, EolTestItem, PackInstance, PackStatus, QuarantineRecord } from '../domain/types';
import { packAssemblyService } from './packAssemblyService';

class EolQaService {
  private TEST_RUN_STORAGE_KEY = 'aayatana_eol_test_runs_v1';
  private QUARANTINE_STORAGE_KEY = 'aayatana_quarantine_v1';

  private loadTestRuns(): EolTestRun[] {
    const data = safeStorage.getItem(this.TEST_RUN_STORAGE_KEY);
    return data ? JSON.parse(data) : this.ensureSeedData();
  }

  private saveTestRuns(runs: EolTestRun[]) {
    safeStorage.setItem(this.TEST_RUN_STORAGE_KEY, JSON.stringify(runs));
  }

  private loadQuarantine(): QuarantineRecord[] {
    const data = safeStorage.getItem(this.QUARANTINE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveQuarantine(records: QuarantineRecord[]) {
    safeStorage.setItem(this.QUARANTINE_STORAGE_KEY, JSON.stringify(records));
  }

  private ensureSeedData(): EolTestRun[] {
    // We seed a completed test for demo purposes
    return [];
  }

  /**
   * Generates a default test plan based on SKUs
   * In a real system, this would be fetched from a Recipe/Procedure service
   */
  private getDefaultItems(): EolTestItem[] {
    return [
      { id: 'elec-1', group: 'Electrical', name: 'Open Circuit Voltage (OCV)', required: true, status: 'NOT_RUN', unit: 'V', threshold: '48.0 - 54.0' },
      { id: 'elec-2', group: 'Electrical', name: 'Internal Resistance (IR)', required: true, status: 'NOT_RUN', unit: 'mΩ', threshold: '< 35.0' },
      { id: 'elec-3', group: 'Electrical', name: 'Insulation Resistance', required: true, status: 'NOT_RUN', unit: 'MΩ', threshold: '> 500' },
      { id: 'bms-1', group: 'BMS', name: 'CAN Communication Handshake', required: true, status: 'NOT_RUN' },
      { id: 'bms-2', group: 'BMS', name: 'Firmware Revision Check', required: true, status: 'NOT_RUN' },
      { id: 'mech-1', group: 'Mechanical', name: 'Torque Inspection (Busbars)', required: true, status: 'NOT_RUN' },
      { id: 'mech-2', group: 'Mechanical', name: 'Visual Case Inspection', required: true, status: 'NOT_RUN' }
    ];
  }

  async listEolQueue(filters?: { status?: PackStatus }): Promise<PackInstance[]> {
    const allPacks = await packAssemblyService.listPacks();
    const eolStatuses = [
      PackStatus.READY_FOR_EOL, 
      PackStatus.IN_EOL_TEST, 
      PackStatus.PASSED, 
      PackStatus.FAILED, 
      PackStatus.QUARANTINED
    ];
    
    let filtered = allPacks.filter(p => eolStatuses.includes(p.status));
    if (filters?.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    return filtered;
  }

  async getTestRun(packId: string): Promise<EolTestRun | undefined> {
    return this.loadTestRuns().find(r => r.packId === packId);
  }

  async createOrLoadTestRun(packId: string, actor: string): Promise<EolTestRun> {
    const runs = this.loadTestRuns();
    let run = runs.find(r => r.packId === packId);
    
    if (!run) {
      run = {
        id: `TR-${Date.now().toString().slice(-6)}`,
        packId,
        startedAt: new Date().toISOString(),
        actor,
        items: this.getDefaultItems(),
        computedResult: 'PENDING'
      };
      runs.unshift(run);
      this.saveTestRuns(runs);
      
      // Also update pack status
      const pack = await packAssemblyService.getPack(packId);
      if (pack && pack.status === PackStatus.READY_FOR_EOL) {
        // Use service to update pack status via existing logic
        await packAssemblyService.updatePack(packId, { status: PackStatus.IN_EOL_TEST });
      }
    }
    return run;
  }

  async updateTestItem(packId: string, itemId: string, patch: Partial<EolTestItem>): Promise<EolTestRun> {
    const runs = this.loadTestRuns();
    const rIdx = runs.findIndex(r => r.packId === packId);
    if (rIdx === -1) throw new Error("Test run not found");

    const iIdx = runs[rIdx].items.findIndex(i => i.id === itemId);
    if (iIdx === -1) throw new Error("Item not found");

    runs[rIdx].items[iIdx] = { ...runs[rIdx].items[iIdx], ...patch };
    
    // Auto-compute item status based on measurement if threshold is defined (simplified)
    const item = runs[rIdx].items[iIdx];
    if (item.measurement !== undefined && item.threshold) {
      if (item.threshold.startsWith('<')) {
        const limit = parseFloat(item.threshold.replace('<', '').trim());
        item.status = item.measurement < limit ? 'PASS' : 'FAIL';
      } else if (item.threshold.startsWith('>')) {
        const limit = parseFloat(item.threshold.replace('>', '').trim());
        item.status = item.measurement > limit ? 'PASS' : 'FAIL';
      }
    }

    // Re-compute overall result
    const requiredItems = runs[rIdx].items.filter(i => i.required);
    if (requiredItems.some(i => i.status === 'FAIL')) {
      runs[rIdx].computedResult = 'FAIL';
    } else if (requiredItems.every(i => i.status === 'PASS' || i.status === 'NA')) {
      runs[rIdx].computedResult = 'PASS';
    } else {
      runs[rIdx].computedResult = 'PENDING';
    }

    this.saveTestRuns(runs);
    return runs[rIdx];
  }

  async finalizeDecision(packId: string, decision: 'PASS' | 'FAIL' | 'QUARANTINE' | 'SCRAP', payload: { actor: string, notes?: string, ncrId?: string, reason?: string }): Promise<void> {
    const runs = this.loadTestRuns();
    const rIdx = runs.findIndex(r => r.packId === packId);
    if (rIdx === -1) throw new Error("Test run not found");

    runs[rIdx].finalDecision = decision;
    runs[rIdx].decisionBy = payload.actor;
    runs[rIdx].decisionAt = new Date().toISOString();
    runs[rIdx].notes = payload.notes;
    runs[rIdx].completedAt = new Date().toISOString();
    this.saveTestRuns(runs);

    // Update Pack Status
    let newStatus = PackStatus.PASSED;
    if (decision === 'PASS') newStatus = PackStatus.PASSED;
    if (decision === 'FAIL' || decision === 'QUARANTINE') newStatus = PackStatus.QUARANTINED;
    if (decision === 'SCRAP') newStatus = PackStatus.SCRAPPED;

    await packAssemblyService.updatePack(packId, { 
      status: newStatus,
      qcStatus: decision === 'PASS' ? 'PASSED' : 'FAILED'
    });

    if (decision === 'QUARANTINE') {
      const qRecords = this.loadQuarantine();
      qRecords.unshift({
        id: `QN-${Date.now().toString().slice(-4)}`,
        packId,
        reason: payload.reason || "Failed EOL Test",
        ncrId: payload.ncrId,
        createdAt: new Date().toISOString(),
        createdBy: payload.actor,
        notes: payload.notes
      });
      this.saveQuarantine(qRecords);
    }
  }

  async releaseFromQuarantine(packId: string, disposition: QuarantineRecord['disposition'], actor: string): Promise<void> {
    const records = this.loadQuarantine();
    const rIdx = records.findIndex(r => r.packId === packId && !r.releasedAt);
    if (rIdx !== -1) {
      records[rIdx].releasedAt = new Date().toISOString();
      records[rIdx].releasedBy = actor;
      records[rIdx].disposition = disposition;
      this.saveQuarantine(records);
    }

    // Reset pack to a status where it can be handled (usually READY_FOR_EOL if retest needed, or PASSED if minor fix)
    let nextStatus = PackStatus.READY_FOR_EOL;
    if (disposition === 'SCRAP') nextStatus = PackStatus.SCRAPPED;
    
    await packAssemblyService.updatePack(packId, { status: nextStatus });
  }

  async getDispatchEligiblePacks(): Promise<PackInstance[]> {
    const all = await packAssemblyService.listPacks();
    return all.filter(p => p.status === PackStatus.PASSED && p.qcStatus === 'PASSED');
  }
}

export const eolQaService = new EolQaService();
