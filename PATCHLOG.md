# Aayatana Tech | Console Patch Log

## Active Patch Lineage

### P-056H: POST_STABILIZE_HOTFIX
- **Date**: 2024-05-24
- **Summary**: Essential UX restoration and diagnostic re-introduction.
- **Changes**:
  - Restored per-menu unique icons in the sidebar.
  - Fixed deterministic versioning and patch display in the Layout footer.
  - Updated Route Ledger with pattern matching to prevent false-positive "Route Terminated" errors on dynamic detail pages.
  - Introduced a single collapsible Diagnostic Panel injected into the main layout.

---

### P-056: ROUTE_LEDGER_RECONCILE_STABLE
- **Date**: 2024-05-24
- **Summary**: Significant stability overhaul for routing and diagnostics.
- **Changes**:
  - Implemented `src/app/routeLedger.ts` as the canonical source for all system paths.
  - Reconciled `App.tsx` and sidebar links to use the new ledger.
  - Replaced multiple debug surfaces with ONE universal `DiagnosticPanel` injected at the layout level.
  - Softened `RouteGuard` to prevent redirects when data is missing or in demo-transition.
  - Fixed Lineage Audit redirect behavior; the page now persists regardless of data state.

---

### P-055: TRACE_ROUTES_FIX_HUD_CLEANUP
- **Date**: 2024-05-24
- **Summary**: Resolve module resolution errors (alias issues) and fix navigation loops in the Trace module.