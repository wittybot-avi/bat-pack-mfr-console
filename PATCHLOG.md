
# Patch Log

## UI_PATCH_E_MODULE_BIND_V1
- **Date**: 2024-05-24
- **Summary**: Implemented the Cell-to-Module assembly binding workflow.
  - Enhanced `ModuleAssemblyDetail` with operational Scan-to-Bind interface.
  - Implemented `moduleAssemblyService` to manage binding lifecycle, SKU target enforcement, and chemistry validation.
  - Integrated `cellTraceabilityService` for global serial lookup and status synchronization (`BOUND` state).
  - Enforced RBAC: Operators can bind/seal, QA can raise exceptions, Super Admin can override constraints.
  - Updated `LineageView` to dynamically display component graph based on ledger bindings.
- **Files changed**:
  - src/domain/types.ts
  - src/services/moduleAssemblyService.ts (New)
  - src/services/cellTraceabilityService.ts (Update)
  - src/pages/ModuleAssemblyDetail.tsx (Update)
  - src/pages/LineageView.tsx (Update)
  - src/app/patchInfo.ts

## UI_PATCH_D_CELL_SERIALIZATION_V1
- **Date**: 2024-05-24
... (existing logs) ...
