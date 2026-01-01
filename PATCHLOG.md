# Patch Log

## UI_PATCH_K_WORKFLOW_GUARDRAILS_V1
- **Date**: 2024-05-24
- **Summary**: Implemented state-machine enforcement and guided navigation across all core manufacturing modules.
  - **Action Gating**: Buttons now disable based on both User Role AND Entity State (e.g., Cannot seal an empty module).
  - **Intelligent Tooltips**: All disabled actions now explain *why* they are locked and *what* prerequisite is missing.
  - **Guided Next Steps**: Context-aware prompts appearing on SKU, Batch, and Pack screens to guide operators to the next logical workflow phase.
  - **Centralized Service**: Created `workflowGuardrails.ts` as the single source of truth for workflow state logic.
- **Files changed**:
  - src/app/patchInfo.ts
  - PATCHLOG.md
  - src/services/workflowGuardrails.ts
  - src/components/WorkflowGuards.tsx
  - src/pages/SkuDetail.tsx
  - src/pages/BatchDetail.tsx
  - src/pages/ModuleAssemblyDetail.tsx
  - src/pages/PackAssemblyDetail.tsx
  - src/pages/BatteryDetail.tsx
  - src/pages/EolQaDetail.tsx
  - PATCH_NOTES_P33.md

## UI_PATCH_L_HARDEN_SAFETY_NETS_V1
- **Date**: 2024-05-24
... (rest of the file) ...