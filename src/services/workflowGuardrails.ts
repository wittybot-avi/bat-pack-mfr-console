import { ScreenId } from '../rbac/screenIds';
import { canDo } from '../rbac/can';
import { ModuleStatus, PackStatus, BatchStatus, BatteryStatus, Battery } from '../domain/types';

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
 * Standardized Visual Status Labels
 */
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
   * SKU GUARDRAILS
   */
  getSkuGuardrail(sku: any, clusterId: string): Record<string, GuardrailResult> {
    const canEdit = canDo(clusterId, ScreenId.SKU_LIST, 'E');
    
    return {
      activate: {
        allowed: canEdit && sku.status === 'DRAFT',
        reason: !canEdit ? "Required Role: Engineering (C4)" : sku.status !== 'DRAFT' ? "Blueprint is already processed" : ""
      },
      createBatch: {
        allowed: sku.status === 'ACTIVE',
        reason: sku.status !== 'ACTIVE' ? "Blueprint must be ACTIVATED before production use" : ""
      }
    };
  }

  /**
   * BATCH GUARDRAILS
   */
  getBatchGuardrail(batch: any, clusterId: string): Record<string, GuardrailResult> {
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    const isQA = clusterId === 'C3' || clusterId === 'CS';

    return {
      releaseToLine: {
        allowed: isOperator && batch.status === BatchStatus.DRAFT,
        reason: batch.status !== BatchStatus.DRAFT ? "Batch already released" : "Required Role: Manufacturing (C2)"
      },
      closeBatch: {
        allowed: (isOperator || isQA) && batch.status !== BatchStatus.CLOSED,
        reason: batch.status === BatchStatus.CLOSED ? "Batch is already finalized" : "Prerequisites: All units must pass EOL"
      }
    };
  }

  /**
   * MODULE GUARDRAILS
   */
  getModuleGuardrail(module: any, clusterId: string): Record<string, GuardrailResult> {
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    const isSealed = module.status === ModuleStatus.SEALED || module.status === ModuleStatus.CONSUMED;
    
    return {
      bind: {
        allowed: isOperator && !isSealed && module.boundCellSerials.length < module.targetCells,
        reason: isSealed ? "Module is SEALED" : !isOperator ? "Required Role: Manufacturing (C2)" : module.boundCellSerials.length >= module.targetCells ? "Target cell count reached" : ""
      },
      seal: {
        allowed: isOperator && !isSealed && module.boundCellSerials.length === module.targetCells,
        reason: module.boundCellSerials.length !== module.targetCells ? `Requires ${module.targetCells} cells (${module.boundCellSerials.length} found)` : isSealed ? "Module already sealed" : ""
      }
    };
  }

  /**
   * PACK GUARDRAILS
   */
  getPackGuardrail(pack: any, clusterId: string): Record<string, GuardrailResult> {
    const isOperator = clusterId === 'C2' || clusterId === 'CS';
    const isFinalized = pack.status === PackStatus.READY_FOR_EOL || pack.status === PackStatus.FINALIZED;
    const isComplete = pack.moduleIds.length === (pack.requiredModules || 1);

    return {
      linkModule: {
        allowed: isOperator && !isFinalized && !isComplete,
        reason: isFinalized ? "Build order locked" : isComplete ? "Required modules already linked" : ""
      },
      bindBms: {
        allowed: isOperator && !isFinalized,
        reason: isFinalized ? "Build order locked" : ""
      },
      finalize: {
        allowed: isOperator && !isFinalized && isComplete && pack.packSerial && pack.qcStatus === 'PASSED' && pack.bmsId,
        reason: !isComplete ? "Modules incomplete" : !pack.packSerial ? "Missing serial assignment" : pack.qcStatus !== 'PASSED' ? "Assembly QC not passed" : !pack.bmsId ? "BMS not bound" : ""
      }
    };
  }

  /**
   * BATTERY / DEVICE GUARDRAILS
   */
  getBatteryGuardrail(battery: Battery, clusterId: string): Record<string, GuardrailResult> {
    const isBmsEng = clusterId === 'C5' || clusterId === 'CS';
    const isQA = clusterId === 'C3' || clusterId === 'CS';
    const isLogistics = clusterId === 'C6' || clusterId === 'CS';

    return {
      provision: {
        allowed: isBmsEng && battery.status === BatteryStatus.PROVISIONING,
        reason: battery.status !== BatteryStatus.PROVISIONING ? "Asset must be in PROVISIONING stage" : ""
      },
      eolUpload: {
        allowed: isQA && battery.status === BatteryStatus.QA_TESTING,
        reason: battery.status !== BatteryStatus.QA_TESTING ? "Asset must be in QA_TESTING stage" : ""
      },
      approveStock: {
        allowed: isQA && battery.eolResult === 'PASS' && battery.status !== BatteryStatus.IN_INVENTORY,
        reason: battery.eolResult !== 'PASS' ? "Requires PASS EOL result" : ""
      },
      dispatch: {
        allowed: isLogistics && battery.status === BatteryStatus.IN_INVENTORY,
        reason: battery.status !== BatteryStatus.IN_INVENTORY ? "Must be IN_INVENTORY to dispatch" : ""
      }
    };
  }

  /**
   * NEXT LOGICAL STEP CALCULATOR
   */
  getNextRecommendedStep(entity: any, type: 'SKU' | 'BATCH' | 'MODULE' | 'PACK' | 'BATTERY'): NextStep | null {
    switch (type) {
      case 'SKU':
        if (entity.status === 'DRAFT') return { label: 'Activate Blueprint', path: '', description: 'Lock design for production use.', roleRequired: 'Engineering (C4)' };
        if (entity.status === 'ACTIVE') return { label: 'Start Production Batch', path: '/batches', description: 'Begin manufacturing units from this SKU.', roleRequired: 'Manufacturing (C2)' };
        break;
      case 'BATCH':
        if (entity.status === BatchStatus.DRAFT) return { label: 'Release to Line', path: '', description: 'Begin assembly operations.', roleRequired: 'Manufacturing (C2)' };
        if (entity.status === BatchStatus.IN_PRODUCTION) return { label: 'Link Components', path: '/operate/modules', description: 'Proceed to bind cells/modules.', roleRequired: 'Manufacturing (C2)' };
        break;
      case 'MODULE':
        if (entity.status === ModuleStatus.IN_PROGRESS) return { label: 'Seal sub-assembly', path: '', description: 'Complete cell binding phase.', roleRequired: 'Operator (C2)' };
        if (entity.status === ModuleStatus.SEALED) return { label: 'Link to Pack Build', path: '/operate/packs', description: 'Integrate this module into a final enclosure.', roleRequired: 'Manufacturing (C2)' };
        break;
      case 'PACK':
        if (entity.status === PackStatus.DRAFT || entity.status === PackStatus.IN_PROGRESS) return { label: 'Complete Build Order', path: '', description: 'Finalize assembly and bind BMS.', roleRequired: 'Manufacturing (C2)' };
        if (entity.status === PackStatus.READY_FOR_EOL) return { label: 'Commence EOL Test', path: '/eol', description: 'Run electrical and safety verification.', roleRequired: 'QA (C3)' };
        break;
    }
    return null;
  }
}

export const workflowGuardrails = new WorkflowGuardrailsService();