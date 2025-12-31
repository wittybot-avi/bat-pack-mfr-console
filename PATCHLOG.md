
# Patch Log

## UI_PATCH_I_TRACE_SEARCH_EXPORT_V1
- **Date**: 2024-05-24
- **Summary**: Implemented Global Trace Search, Quick Jump, and Multi-format Exports.
  - **Global Search**: Search bar now resolves Cell Serials, Pack IDs, SKU Codes, and Lot Codes to navigate users to the correct context.
  - **Trace Quick View**: Added a reusable `TraceDrawer` side panel to main asset lists for instant genealogy inspection.
  - **Client-side Exports**: Built browser-based exporters for JSON, CSV, and "DPP-lite" (Digital Product Passport preview) formats.
  - **Lineage UI Enhancement**: Improved Lineage Audit view with internal search filters, copy-to-clipboard actions, and explicit compliance rule failure descriptions.
- **Files changed**:
  - src/services/traceSearchService.ts
  - src/utils/exporters.ts
  - src/components/TraceDrawer.tsx
  - src/components/Layout.tsx
  - src/pages/CellLotsList.tsx
  - src/pages/ModuleAssemblyList.tsx
  - src/pages/PackAssemblyList.tsx
  - src/pages/LineageView.tsx
  - src/app/patchInfo.ts

## UI_PATCH_H_ASSEMBLY_BINDING_LINEAGE_V1
- **Date**: 2024-05-24
... (existing logs) ...
