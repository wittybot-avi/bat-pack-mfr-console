
import { safeStorage } from '../utils/safeStorage';
import { ModuleInstance, ModuleStatus, CellBindingRecord, ExceptionRecord } from '../domain/types';
import { cellTraceabilityService } from './cellTraceabilityService';
import { skuService } from './skuService';

class ModuleAssemblyService {
  private MOD_STORAGE_KEY = 'aayatana_modules_v1';
  private BIND_STORAGE_KEY = 'aayatana_cell_bindings_v1';
  private EXC_STORAGE_KEY = 'aayatana_assembly_exceptions_v1';

  private loadModules(): ModuleInstance[] {
    const data = safeStorage.getItem(this.MOD_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveModules(modules: ModuleInstance[]) {
    safeStorage.setItem(this.MOD_STORAGE_KEY, JSON.stringify(modules));
  }

  private loadBindings(): CellBindingRecord[] {
    const data = safeStorage.getItem(this.BIND_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveBindings(bindings: CellBindingRecord[]) {
    safeStorage.setItem(this.BIND_STORAGE_KEY, JSON.stringify(bindings));
  }

  private loadExceptions(): ExceptionRecord[] {
    const data = safeStorage.getItem(this.EXC_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveExceptions(exceptions: ExceptionRecord[]) {
    safeStorage.setItem(this.EXC_STORAGE_KEY, JSON.stringify(exceptions));
  }

  async getModule(id: string): Promise<ModuleInstance | undefined> {
    return this.loadModules().find(m => m.id === id);
  }

  async listModules(): Promise<ModuleInstance[]> {
    return this.loadModules().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async updateModule(id: string, patch: Partial<ModuleInstance>): Promise<ModuleInstance> {
    const modules = this.loadModules();
    const idx = modules.findIndex(m => m.id === id);
    if (idx === -1) throw new Error("Module not found");
    modules[idx] = { ...modules[idx], ...patch, updatedAt: new Date().toISOString() };
    this.saveModules(modules);
    return modules[idx];
  }

  async bindCellToModule(moduleId: string, serial: string, actor: string, isSuper: boolean = false): Promise<CellBindingRecord> {
    const module = await this.getModule(moduleId);
    if (!module) throw new Error("Module work order not found.");
    if (module.status === ModuleStatus.SEALED && !isSuper) throw new Error("Module is sealed. Cannot bind more cells.");
    if (module.boundCellSerials.length >= module.targetCells && !isSuper) throw new Error("Target cell count reached.");

    // 1. Find serial globally
    const lookup = await cellTraceabilityService.findSerialGlobal(serial);
    if (!lookup) throw new Error(`Serial ${serial} not found in any lot.`);
    
    const { serial: record, lot } = lookup;

    // 2. Validate status
    if (record.status === 'BOUND') throw new Error(`Serial ${serial} is already bound to another module/pack.`);
    if (record.status !== 'SCANNED' && record.status !== 'GENERATED' && !isSuper) {
        throw new Error(`Serial ${serial} is in ${record.status} status. It must be confirmed/scanned before binding.`);
    }

    // 3. Chemistry Check
    const sku = await skuService.getSku(module.skuId);
    if (sku && lot.chemistry !== sku.chemistry && !isSuper) {
        throw new Error(`Chemistry mismatch! Lot is ${lot.chemistry}, SKU requires ${sku.chemistry}.`);
    }

    // 4. Create Binding
    const newBinding: CellBindingRecord = {
      moduleId,
      serial,
      lotId: lot.id,
      lotCode: lot.lotCode,
      boundAt: new Date().toISOString(),
      actor,
      chemistry: lot.chemistry
    };

    const bindings = this.loadBindings();
    bindings.push(newBinding);
    this.saveBindings(bindings);

    // 5. Update Module
    await this.updateModule(moduleId, {
      boundCellSerials: [...module.boundCellSerials, serial],
      status: ModuleStatus.IN_PROGRESS,
      actor
    });

    // 6. Update Serial Status
    await cellTraceabilityService.updateSerialStatus(lot.id, serial, 'BOUND', actor);

    return newBinding;
  }

  async unbindCellFromModule(moduleId: string, serial: string, actor: string, isSuper: boolean = false): Promise<void> {
    const module = await this.getModule(moduleId);
    if (!module) return;
    if (module.status === ModuleStatus.SEALED && !isSuper) throw new Error("Module is sealed.");

    const bindings = this.loadBindings();
    const filtered = bindings.filter(b => !(b.moduleId === moduleId && b.serial === serial));
    this.saveBindings(filtered);

    const lookup = await cellTraceabilityService.findSerialGlobal(serial);
    if (lookup) {
        await cellTraceabilityService.updateSerialStatus(lookup.lot.id, serial, 'SCANNED', actor);
    }

    await this.updateModule(moduleId, {
      boundCellSerials: module.boundCellSerials.filter(s => s !== serial),
      actor
    });
  }

  async sealModule(moduleId: string, actor: string): Promise<ModuleInstance> {
    const module = await this.getModule(moduleId);
    if (!module) throw new Error("Module not found.");
    if (module.boundCellSerials.length !== module.targetCells) {
        throw new Error(`Cannot seal: Bound count (${module.boundCellSerials.length}) does not match target (${module.targetCells}).`);
    }

    return await this.updateModule(moduleId, { status: ModuleStatus.SEALED, actor });
  }

  async listBindingsByModule(moduleId: string): Promise<CellBindingRecord[]> {
    return this.loadBindings().filter(b => b.moduleId === moduleId);
  }

  async listBindingsBySerial(serial: string): Promise<CellBindingRecord[]> {
    return this.loadBindings().filter(b => b.serial === serial);
  }

  async raiseException(entityId: string, entityType: 'module' | 'pack', message: string, severity: any, actor: string): Promise<ExceptionRecord> {
    const exceptions = this.loadExceptions();
    const newEx: ExceptionRecord = {
      id: `EXC-${Date.now()}`,
      entityType,
      entityId,
      severity,
      message,
      createdAt: new Date().toISOString(),
      actor
    };
    exceptions.push(newEx);
    this.saveExceptions(exceptions);
    return newEx;
  }
}

export const moduleAssemblyService = new ModuleAssemblyService();
