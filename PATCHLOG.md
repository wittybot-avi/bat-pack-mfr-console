
# Patch Log

## UI_PATCH_H_ASSEMBLY_BINDING_LINEAGE_V1
- **Date**: 2024-05-24
- **Summary**: Implemented the end-to-end assembly binding workflow and enhanced the lineage audit engine.
  - **Module Detail**: Added an interactive "Binding" UI where operators can scan cell serials into a module. Enforces SKU target counts and chemistry consistency.
  - **Pack Detail**: Added module linkage UI. Links "SEALED" modules to a pack build. Implemented QC status management (Pass/Fail) and build finalization.
  - **Lineage Engine**: Created an append-only event ledger for all assembly actions. Lineage events now capture actor roles and workstation contexts.
  - **Lineage View**: Upgraded the visualization from placeholders to a functional genealogy explorer. Users can now search for any ID and see the full upstream (Parent) and downstream (Children) tree.
  - **Rule Gating**: Integrated SKU-based validation rules into the binding process to prevent mis-assembly in real-time.
- **Files changed**:
  - src/services/moduleAssemblyService.ts
  - src/services/packAssemblyService.ts
  - src/pages/ModuleAssemblyDetail.tsx
  - src/pages/PackAssemblyDetail.tsx
  - src/pages/LineageView.tsx
  - src/app/patchInfo.ts

## UI_PATCH_G_HF2_HASHROUTER_FALLBACK
- **Date**: 2024-05-24
... (existing logs) ...
