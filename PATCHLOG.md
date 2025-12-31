# Patch Log

## UI_PATCH_A4_SKU_RESTORE
- **Date**: 2024-05-24
- **Summary**: Full restoration of SKU Design Studio UI after hard router stabilization.
  - Replaced `SafePlaceholder` components in `src/pages/SkuList.tsx` and `src/pages/SkuDetail.tsx` with production implementations.
  - SKU List: Features search, creation modal, and cloning functionality.
  - SKU Detail: Features tabbed interface for Overview, Electrical, Physical, Rules (Gating), and Version History.
  - Enhanced SKU Detail sidebar with "Blueprint IQ" summary and energy calculations.
  - Added non-intrusive "Restored (A.4)" marker in SKU List footer.
- **Files changed**:
  - src/pages/SkuList.tsx
  - src/pages/SkuDetail.tsx
  - src/app/patchInfo.ts

## UI_PATCH_A3_ROUTER_PLACEHOLDER_FIX
- **Date**: 2024-05-24
- **Summary**: Implemented hard router stabilization to prevent runtime crashes during navigation.
  - Replaced SKU Design Studio components with `SafePlaceholder` to isolate them from service/hook dependencies during stabilization.
  - Created `src/pages/SafePlaceholder.tsx` as a guaranteed-safe landing component.
  - Relocated `ErrorBoundary` inside `Router` to properly catch component-level lifecycle errors without breaking the routing context.
  - Verified all module routes in `App.tsx` use direct imports and resolve correctly.
- **Files changed**:
  - src/pages/SafePlaceholder.tsx
  - src/pages/SkuList.tsx
  - src/pages/SkuDetail.tsx
  - App.tsx
  - src/app/patchInfo.ts

## UI_PATCH_A2_ROUTER_STABILITY_AND_ERROR_BOUNDARY
- **Date**: 2024-05-24
- **Summary**: Stabilized application navigation and implemented global error handling.
... (existing logs) ...