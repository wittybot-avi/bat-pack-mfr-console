
# Patch Log

## UI_PATCH_C_MODULE_PACK_ASSEMBLY_V1
- **Date**: 2024-05-24
- **Summary**: Implemented the Module and Pack Assembly workflow modules.
  - Added new screens: `MODULE_ASSEMBLY_LIST`, `MODULE_ASSEMBLY_DETAIL`, `PACK_ASSEMBLY_LIST`, `PACK_ASSEMBLY_DETAIL`.
  - Implemented `moduleService` for managing sub-assembly work orders and cell binding.
  - Implemented `packService` for final assembly management and BMS/Firmware linkage.
  - Module Assembly: Features stepper-based UI for SKU selection, cell scanning (bulk/single), and sealing.
  - Pack Assembly: Features linkage of SEALED modules, BMS serial assignment, and finalized record generation.
  - Updated RBAC policy to grant production roles creation/edit rights and QA roles approval rights.
- **Files changed**:
  - src/domain/types.ts
  - src/rbac/screenIds.ts
  - src/rbac/policy.ts
  - src/app/routeRegistry.ts
  - App.tsx
  - src/services/moduleService.ts (New)
  - src/services/packService.ts (New)
  - src/pages/ModuleAssemblyList.tsx (New)
  - src/pages/ModuleAssemblyDetail.tsx (New)
  - src/pages/PackAssemblyList.tsx (New)
  - src/pages/PackAssemblyDetail.tsx (New)
  - src/app/patchInfo.ts

## UI_PATCH_B0_TRACE_ROUTE_MISMATCH_FIX
- **Date**: 2024-05-24
- **Summary**: Aligned TRACE module routes (Cells and Lineage) to a canonical namespace to resolve Diagnostic Mode mismatches.
... (existing logs) ...
