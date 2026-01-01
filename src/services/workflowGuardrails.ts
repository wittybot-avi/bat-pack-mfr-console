import { ScreenId } from '../rbac/screenIds';
import { canDo } from '../rbac/can';
import { 
  ModuleStatus, 
  PackStatus, 
  BatchStatus, 
  BatteryStatus, 
  Battery, 
  ModuleInstance, 
  PackInstance, 
  Batch 
} from '../domain/types';

export interface GuardrailResult {
  allowed: boolean;
  reason: string;
}

export interface NextStep {
  label: string;
  path: string;
  description: string;
  roleRequired: string;
}

/**
 * Standardized Status Mapping for UI Badges
 */
export const STATUS_MAP: Record<string, { label: string, variant: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  // Common
  DRAFT: { label: 'DRAFT', variant: 'outline' },
  ACTIVE: { label: 'ACTIVE', variant: 'success' },
  IN_PROGRESS: { label: 'IN PROGRESS', variant: 'default' },
  BLOCKED: { label: 'BLOCKED', variant: 'warning' },
  COMPLETED: { label: 'COMPLETED', variant: 'success' },
  FAILED: { label: 'FAILED', variant: 'destructive' },
  
  // Specific Overrides
  [BatchStatus.ON_HOLD]: { label: 'BLOCKED', variant: 'warning' },
  [BatchStatus.CLOSED]: { label: 'COMPLETED', variant: 'success' },
  [ModuleStatus.SEALED]: { label: 'COMPLETED', variant: 'success' },
  [ModuleStatus.CONSUMED]: { label: 'COMPLETED (LINKED)', variant: 'secondary' },
  [PackStatus.READY_FOR_EOL]: { label: 'IN PROGRESS (QUEUED)', variant: 'default' },
  [PackStatus.FINALIZED]: { label: 'COMPLETED', variant: 'success' },
  [BatteryStatus.DEPLOYED]: { label: 'COMPLETED (FIELD)', variant: 'success' },
  [BatteryStatus.SCRAPPED]: { label: 'FAILED (SCRAP)', variant: 'destructive' },
  [BatteryStatus.QA_TESTING]: { label: 'IN PROGRESS (QA)', variant: 'default' },
  [BatteryStatus.ASSEMBLY]: { label: 'ASSEMBLY', variant: 'outline' },
  [BatteryStatus.PROVISIONING]: { label: 'PROVISIONING', variant: 'secondary' }
};

export const STATUS_LABELS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  IN_PROGRESS: 'IN PROGRESS',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

class WorkflowGuardrailsService {
  /**
   * SKU Guardrails
   */
  getSkuGuardrail(sku: any, clusterId: string): Record<string, GuardrailResult> {
    const canEdit = canDo(clusterId, ScreenId.SKU_LIST, 'E');
    return {
      activate: {
        allowed: canEdit && sku.status === 'DRAFT',
        reason: sku.status !== 'DRAFT' ? "Blueprint is already processed" : "Engineering permissions required (C4)"
      },
      createBatch: {
        allowed: sku.status === 'ACTIVE',
        reason: "Blueprint must be ACTIVATED before production use"
      }
    };
  }

  /**
   * Batch Guardrails
   */
  getBatchGuardrail(batch: Batch, clusterId: string): Record<string, GuardrailResult> {
    const isProd = clusterId === 'C2' || clusterId === 'CS';
    const isQA = clusterId === 'C3' || clusterId === 'CS';
    return {
      release: {
        allowed: isProd && batch.status === BatchStatus.DRAFT,
        reason: batch.status !== BatchStatus.DRAFT ? "Batch already released" : "Production Manager permissions required (C2)"
      },
      close: {
        allowed: (isProd || isQA) && batch.qtyBuilt >= batch.targetQuantity && batch.qtyPassedEOL > 0,
        reason: "Closure requires built quantity to meet target and units to pass EOL"
      }
    };
  }

  /**
   * Module Guardrails
   */
  getModuleGuardrail(module: ModuleInstance, clusterId: string): Record<string, GuardrailResult> {
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    const isFull = module.boundCellSerials.length === module.targetCells;
    return {
      bind: {
        allowed: isOperator && module.status === ModuleStatus.IN_PROGRESS && !isFull,
        reason: isFull ? "Module is full" : module.status !== ModuleStatus.IN_PROGRESS ? "Module is sealed" : "Operator permissions required (C2)"
      },
      seal: {
        allowed: isOperator && isFull && module.status === ModuleStatus.IN_PROGRESS,
        reason: !isFull ? `Prerequisite: Bind all ${module.targetCells} cells (Currently ${module.boundCellSerials.length})` : "Module already sealed"
      }
    };
  }

  /**
   * Pack Guardrails
   */
  getPackGuardrail(pack: PackInstance, clusterId: string): Record<string, GuardrailResult> {
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    const hasRequiredModules = pack.moduleIds.length === (pack.requiredModules || 1);
    const hasBms = !!pack.bmsId;
    const hasSerial = !!pack.packSerial;

    return {
      finalize: {
        allowed: isOperator && hasRequiredModules && hasBms && hasSerial && pack.qcStatus === 'PASSED',
        reason: !hasRequiredModules ? "Incomplete module linkage" : !hasBms ? "BMS identity not bound" : !hasSerial ? "Serial identity not generated" : pack.qcStatus !== 'PASSED' ? "Assembly QC check failed" : ""
      }
    };
  }

  /**
   * Battery Guardrails (New P34)
   */
  getBatteryGuardrail(battery: Battery, clusterId: string): Record<string, GuardrailResult> {
    const isEng = clusterId === 'C5' || clusterId === 'CS';
    const isQA = clusterId === 'C3' || clusterId === 'CS';
    return {
      provision: {
        allowed: isEng && battery.status === BatteryStatus.PROVISIONING,
        reason: battery.status !== BatteryStatus.PROVISIONING ? "Asset not in provisioning stage" : "BMS Engineer permissions required (C5)"
      },
      test: {
        allowed: isQA && battery.status === BatteryStatus.QA_TESTING,
        reason: "QA Analyst permissions required (C3)"
      }
    };
  }

  /**
   * Guidance Logic
   */
  getNextRecommendedStep(entity: any, type: 'SKU' | 'BATCH' | 'MODULE' | 'PACK' | 'BATTERY'): NextStep | null {
    switch (type) {
      case 'SKU':
        if (entity.status === 'DRAFT') return { label: 'Activate Spec', path: '', description: 'Promote this blueprint to production status.', roleRequired: 'Engineering' };
        if (entity.status === 'ACTIVE') return { label: 'Create Batch', path: '/batches', description: 'Start a manufacturing run using this blueprint.', roleRequired: 'Production' };
        break;
      case 'BATCH':
        if (entity.status === BatchStatus.DRAFT) return { label: 'Release to Line', path: '', description: 'Begin assembly operations for this lot.', roleRequired: 'Supervisor' };
        if (entity.status === BatchStatus.IN_PRODUCTION) return { label: 'Link Components', path: '/operate/modules', description: 'Bind individual cells and modules to this batch.', roleRequired: 'Operator' };
        break;
      case 'MODULE':
        if (entity.status === ModuleStatus.IN_PROGRESS && entity.boundCellSerials.length < entity.targetCells) return { label: 'Bind Cells', path: '', description: 'Scan cell serials into the digital ledger.', roleRequired: 'Operator' };
        if (entity.status === ModuleStatus.IN_PROGRESS && entity.boundCellSerials.length === entity.targetCells) return { label: 'Seal Module', path: '', description: 'Lock the sub-assembly and verify integrity.', roleRequired: 'Operator' };
        if (entity.status === ModuleStatus.SEALED) return { label: 'Link to Pack Build', path: '/operate/packs', description: 'Integrate this sealed module into a pack build.', roleRequired: 'Operator' };
        break;
      case 'PACK':
        if (entity.status === PackStatus.DRAFT || entity.status === PackStatus.IN_PROGRESS) return { label: 'QC & Finalize', path: '', description: 'Perform assembly QC and lock the record.', roleRequired: 'Operator' };
        if (entity.status === PackStatus.READY_FOR_EOL) return { label: 'Run EOL Test', path: '/eol', description: 'Hand over to QA for electrical verification.', roleRequired: 'QA' };
        break;
      case 'BATTERY':
        if (entity.status === BatteryStatus.ASSEMBLY) return { label: 'Start Provisioning', path: '/provisioning', description: 'Connect BMS and initialize digital profile.', roleRequired: 'BMS Engineer' };
        if (entity.status === BatteryStatus.PROVISIONING && entity.provisioningStatus !== 'PASS') return { label: 'Finalize Identity', path: '/provisioning', description: 'Verify security certificates and release to QA.', roleRequired: 'BMS Engineer' };
        if (entity.status === BatteryStatus.QA_TESTING) return { label: 'Run EOL Verification', path: '/eol', description: 'Complete final electrical and safety checks.', roleRequired: 'QA' };
        if (entity.status === BatteryStatus.IN_INVENTORY) return { label: 'Reserve for Order', path: '/inventory', description: 'Allocate this pack to a customer dispatch order.', roleRequired: 'Logistics' };
        break;
    }
    return null;
  }
}

export const workflowGuardrails = new WorkflowGuardrailsService();