
# Patch Log

## UI_PATCH_I_TRACE_SEARCH_EXPORT_V1
- **Date**: 2024-05-24
- **Summary**: Enhanced traceability with global search, quick-jump resolution, and multi-format exports.
  - **Global Trace Search**: Implemented a resolution service in the top header that detects input types (Cell Serial, Pack ID, SKU, Lot) and routes to the correct detail or lineage view.
  - **Trace Quick View**: Added a side drawer to main list pages (Cells, Modules, Packs) for immediate genealogy inspection without page transitions.
  - **Advanced Exports**: Created client-side exporters for JSON, CSV, and "DPP-Lite" (structured JSON-LD for future regulatory compliance).
  - **Lineage Improvements**: Upgraded the lineage explorer with internal asset filtering, quick-copy ID actions, and explicit compliance mismatch alerts.
- **Files changed**:
  - src/services/traceSearchService.ts
  - src/utils/exporters.ts
  - src/components/TraceDrawer.tsx
  - src/components/Layout.tsx
  - src/pages/ModuleAssemblyList.tsx
  - src/pages/PackAssemblyList.tsx
  - src/pages/CellLotsList.tsx
  - src/pages/LineageView.tsx
  - src/app/patchInfo.ts

## UI_PATCH_H_ASSEMBLY_BINDING_LINEAGE_V1
- **Date**: 2024-05-24
... (existing logs) ...
