# Patch Log

## UI_PATCH_GOVERN_CUSTODY_SUITE_V1
- **Date**: 2024-05-24
- **Summary**: Implemented "Custody" module for Chain-of-Custody tracking. Features include Overview, Shipments List, and Detail view with Receive/Accept/Reject workflows for external stakeholders (C9).
- **Files changed**:
  - src/domain/types.ts (Added CustodyStatus to DispatchOrder, refined CustodyEvent)
  - src/rbac/screenIds.ts (Added CUSTODY_* IDs)
  - src/rbac/policy.ts (Permissions for C9, C6, C8, C1)
  - src/services/api.ts (Updated DispatchService and BatteryService for custody logic)
  - src/services/custodyService.ts (New service for custody aggregation)
  - src/pages/Custody.tsx (New overview page)
  - src/pages/CustodyDetail.tsx (New detailed action page)
  - App.tsx (New routes)
  - src/components/Layout.tsx (Nav item)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as C9 (External) -> Verify "Custody" menu exists.
  - [ ] C9 can see shipments list.
  - [ ] C9 can click shipment -> See details.
  - [ ] C9 can "Mark Received" for In-Transit items.
  - [ ] C9 can "Accept" or "Reject" received items.
  - [ ] Login as C6 (Logistics) -> Verify View-Only access to Custody (no action buttons).
  - [ ] Verify Battery Detail page updates location and status after Custody actions.

## UI_PATCH_GOVERN_COMPLIANCE_FUTURE_READINESS_V1
- **Date**: 2024-05-24
- **Summary**: Added "Future Readiness" preview tab to Compliance module. Features previews for DPP (Digital Product Passport), Sustainability metrics, Recycling workflows, and Regulatory Export profiles.
- **Files changed**:
  - src/rbac/screenIds.ts (Added FUTURE_* IDs)
  - src/rbac/policy.ts (Updated policies for C1/C8/C7)
  - src/services/futureReadiness.ts (New service logic)
  - src/pages/Compliance.tsx (Added Future tab and components)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as C8 (Compliance) -> Verify Future Readiness tab is visible.
  - [ ] Verify DPP Preview allows mapping a battery ID to future fields.
  - [ ] Verify Export buttons are disabled with tooltips.
  - [ ] Login as C2 (Production) -> Verify Future tab is hidden (default policy).

## UI_PATCH_GOVERN_COMPLIANCE_SUITE_V1
- **Date**: 2024-05-24
- **Summary**: Implemented full Compliance module with RBAC-gated tabs (Overview, Checks, Findings, Evidence). Added rules engine, scoring logic, and findings management with local persistence.
- **Files changed**:
  - src/rbac/screenIds.ts (Added COMPLIANCE_* IDs)
  - src/rbac/policy.ts (Updated policies for C8, C1, C3, C6, etc.)
  - src/services/complianceService.ts (New service for rules/evidence)
  - src/services/findingsStore.ts (New service for findings)
  - src/pages/Compliance.tsx (New tabbed page)
  - App.tsx (Updated route)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as Super User (CS) -> Verify all Compliance tabs visible.
  - [ ] Login as C8 (Compliance) -> Create a finding, close it. Generate Evidence Pack.
  - [ ] Login as C1 (Exec) -> Verify read-only access to Overview and Findings.
  - [ ] Login as C6 (Logistics) -> Verify only Checks/Audit tabs visible (checks filtered).
  - [ ] Generate Evidence Pack for a known battery (e.g., batt-0) and download JSON.

## UI_PATCH_OBSERVE_ANALYTICS_RENDER_FIX_V1
- **Date**: 2024-05-24
- **Summary**: Fixed wiring of Analytics page in router to replace placeholder. Improved tab resilience on Analytics page.
- **Files changed**:
  - App.tsx (Wired Analytics route)
  - src/pages/Analytics.tsx (Robust tab selection)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as Super User (CS) -> Go to Analytics -> Verify tabbed suite renders.
  - [ ] Login as C1 (Plant Head) -> Go to Analytics -> Verify Overview tab renders.
  - [ ] Verify "Coming Features" placeholder is gone for Analytics.

## UI_PATCH_OBSERVE_ANALYTICS_SUITE_V1
- **Date**: 2024-05-24
- **Summary**: Implemented comprehensive Analytics Suite with RBAC-gated tabs (Overview, Batches, Quality, Location, Reports). Added mock Metrics Service and Geofencing analytics.
- **Files changed**:
  - src/rbac/screenIds.ts (Added ANALYTICS_* IDs)
  - src/rbac/policy.ts (Updated policies for C1-C9)
  - src/services/analyticsMetrics.ts (New service)
  - src/pages/Analytics.tsx (New tabbed page)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as Super User (CS) -> Verify all tabs visible and data populates.
  - [ ] Login as C2 (Mfg) -> Verify Overview/Batches visible, Quality/Location hidden.
  - [ ] Login as C6 (Logistics) -> Verify Location & Movement tab visible.
  - [ ] Login as C3 (QA) -> Verify Quality tab with Pareto chart.
  - [ ] Test Date Range selector (should trigger reload).
  - [ ] Verify Location tab shows dwell time and mock geofence data.

## UI_PATCH_OBSERVE_TELEMETRY_RBAC_V1
- **Date**: 2024-05-24
- **Summary**: Upgraded Telemetry module to be RBAC-aware with Live/History modes, role-based battery selection, and a mock telemetry service.
- **Files changed**:
  - src/rbac/screenIds.ts (Added TELEMETRY_* IDs)
  - src/rbac/policy.ts (Updated policies for C1-C9)
  - src/services/telemetryService.ts (New service)
  - src/pages/Telemetry.tsx (Full refactor)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as Super User (CS) -> Verify Live & History tabs, Export button, all batteries visible.
  - [ ] Login as C2 (Mfg) -> Verify Live tab only, battery picker filters for Production batteries.
  - [ ] Login as C7 (Warranty) -> Verify History tab only, picker shows only RMA/Issue units.
  - [ ] Login as C6 (Logistics) -> Verify Access Denied (not in sidebar or route blocked).
  - [ ] Test live chart streaming (Pause/Resume).
  - [ ] Test history range selector.

## UI_PATCH_OBSERVE_DASHBOARD_RBAC_V1
- **Date**: 2024-05-24
- **Summary**: Upgraded Dashboard to be role-aware using granular widget permissions. Implemented `DashboardMetricsService` to aggregate mock data from various services.
- **Files changed**:
  - src/rbac/screenIds.ts (Added DASHBOARD_* widget IDs)
  - src/rbac/policy.ts (Updated policies for C1-C9)
  - src/services/dashboardMetrics.ts (New service)
  - src/pages/Dashboard.tsx (Refactored to modular widgets)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as Super User (CS) -> Verify all widget sections (Prod, Quality, Log, Risk) visible.
  - [ ] Login as C2 (Mfg) -> Verify Production charts visible, Logistics/Risk hidden.
  - [ ] Login as C6 (Logistics) -> Verify Logistics widgets visible.
  - [ ] Login as C9 (External) -> Verify minimal Executive Summary only.
  - [ ] Check KPI card drilldowns navigate to correct lists.

## UI_PATCH_DISPATCH_NAV_FIX_V1
- **Date**: 2024-05-24
- **Summary**: Fixed navigation configuration to correctly display the "Dispatch" sidebar item. Mapped `DISPATCH_LIST` screen ID to the sidebar layout configuration.
- **Files changed**:
  - src/components/Layout.tsx (Updated NAV_CONFIG)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as Super User (CS) -> Verify "Dispatch" appears under "Operate".
  - [ ] Click "Dispatch" -> Verify Dispatch List page loads.
  - [ ] Click an order -> Verify Dispatch Detail page loads.

## UI_PATCH_DISPATCH_MODULE_V1
- **Date**: 2024-05-24
- **Summary**: Implemented Dispatch Module. Users can now create Dispatch Orders, pick batteries from Inventory, generate documents (Packing List, Manifest), and mark shipments as Dispatched.
- **Files changed**:
  - src/domain/types.ts (Added DispatchOrder, DispatchStatus, CustodyStatus)
  - src/rbac/screenIds.ts (Added DISPATCH_LIST, DISPATCH_DETAIL)
  - src/rbac/policy.ts (Updated policies for C6/C3)
  - src/services/api.ts (Implemented DispatchService)
  - src/pages/DispatchList.tsx (New)
  - src/pages/DispatchDetail.tsx (New)
  - App.tsx (Routing)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as C6 (Logistics) -> Create Dispatch Order -> Add Batteries -> Mark Ready -> Dispatch.
  - [ ] Verify dispatched batteries move to IN_TRANSIT status and disappear from Inventory list.
  - [ ] Login as C3 (QA) -> View Dispatch Orders (ReadOnly).
  - [ ] Login as C9 -> No access to Dispatch.

## UI_PATCH_INVENTORY_MODULE_V1
- **Date**: 2024-05-24
- **Summary**: Implemented Inventory (Finished Goods) module. Features include Put-away, Location Management, Reservation, and Quarantine workflows. Restricted eligibility to EOL Pass batteries.
- **Files changed**:
  - src/domain/types.ts (Added InventoryStatus, InventoryMovementEntry)
  - src/rbac/policy.ts (Updated Inventory permissions for C3/C6)
  - src/services/api.ts (Implemented InventoryService)
  - src/pages/InventoryList.tsx (New Inventory UI)
  - App.tsx (Updated routes)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as C6 (Logistics) -> View Inventory -> Perform Put-away -> Reserve for Dispatch.
  - [ ] Login as C3 (QA) -> Quarantine a battery -> Verify status change -> Release.
  - [ ] Verify non-EOL-pass batteries do not appear in Inventory.
  - [ ] Verify C9 cannot access Inventory.

## UI_PATCH_EOL_QA_STATION_V1
- **Date**: 2024-05-24
- **Summary**: Implemented EOL / QA Station module with stepper workflow for testing, dispositioning, and certifying batteries. Added `EolService` mock and updated RBAC.
- **Files changed**:
  - src/domain/types.ts (Added EolMeasurements, QaDisposition, EolLog)
  - src/rbac/screenIds.ts (Added EOL screens)
  - src/rbac/policy.ts (Updated C3/CS/C5 policies)
  - src/services/api.ts (Implemented EolService, updated Battery mock)
  - src/components/Layout.tsx (Updated Sidebar)
  - src/pages/EolStation.tsx (New Station UI)
  - src/pages/EolStationSetup.tsx (New Setup UI)
  - App.tsx (Routes)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as C3 (QA) -> Access EOL Station -> Run Test -> Disposition PASS -> Certify.
  - [ ] Login as C3 -> Fail a battery -> Verify Disposition = FAIL and Reason Code required.
  - [ ] Login as C4 (IT) -> Access EOL Station -> View Only (Actions disabled).
  - [ ] Login as C2 (Mfg) -> EOL menu hidden or Access Denied.
  - [ ] Verify Battery Detail updates with EOL results and Certificate Ref.

## UI_PATCH_PROVISIONING_CONSOLE_STATION_V1
- **Date**: 2024-05-24
- **Summary**: Implemented "Station-Style" Provisioning Console with a multi-step workflow for scanning batteries, binding BMS, flashing firmware, simulated calibration, and security injection. Added `ProvisioningService` mock implementation.
- **Files changed**:
  - src/domain/types.ts (Added logs, calibration status)
  - src/rbac/screenIds.ts (Added setup screen ID)
  - src/rbac/policy.ts (Updated permissions for C4/C5/CS)
  - src/services/api.ts (Implemented ProvisioningService)
  - src/components/Layout.tsx (Added sidebar item for Setup)
  - src/pages/ProvisioningConsole.tsx (New Stepper UI)
  - src/pages/ProvisioningStationSetup.tsx (New Config Page)
  - App.tsx (Routes)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as C5 (BMS) -> Access Provisioning -> Complete full flow (Scan -> Finalize).
  - [ ] Verify Battery Detail page reflects new firmware/calibration status.
  - [ ] Login as C4 (IT) -> Access Provisioning -> View only (buttons disabled or hidden actions).
  - [ ] Login as C4 -> Access Station Setup -> Change Station ID -> Persists.
  - [ ] Login as C2 (Mfg) -> Provisioning menu hidden or Access Denied.

## UI_PATCH_BATTERIES_ROUTE_WIRING_FIX_V1
- **Date**: 2024-05-24
- **Summary**: Connected the Batteries module routes to the actual implementation components (BatteriesListPage and BatteryDetailPage) instead of the Placeholder component.
- **Files changed**:
  - App.tsx (Imported new pages, updated /batteries and /batteries/:id routes)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Navigate to "Batteries" via sidebar -> Should see List UI (Table), not "Coming Features".
  - [ ] Click a battery row -> Should navigate to Detail UI.
  - [ ] Direct link /batteries/batt-1 works.

## UI_PATCH_BATTERIES_LIST_AND_DETAIL_V2
- **Date**: 2024-05-24
- **Summary**: Enhanced Batteries module to V2 with clickable Batch linkage, direct row actions for operations (Provision, Dispatch, Export), and stricter RBAC visibility for external (C9) users on the list view.
- **Files changed**:
  - src/pages/Batteries.tsx (Added Batch Link, Action Icons, C9 column rules)
  - src/pages/BatteryDetail.tsx (Added clickable Batch ID)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as Super User -> Click Batch ID in Battery List -> Navigates to Batch Detail.
  - [ ] Login as C5 (BMS) -> See Provision icon in row -> Click triggers provision.
  - [ ] Login as C6 (Logistics) -> See Dispatch icon in row -> Click triggers dispatch prompt.
  - [ ] Login as C9 (External) -> Verify Provisioning/Internal Status columns are hidden.
  - [ ] Login as C9 -> Verify no action icons except View/Export are visible.
- **Rollback instructions**: Restore folder snapshot or revert commits associated with UI_PATCH_BATTERIES_LIST_AND_DETAIL_V2.

## UI_PATCH_BATTERIES_MODULE_RBAC_V1
- **Date**: 2024-05-24
- **Summary**: Implemented full Batteries module with comprehensive domain model, scan-first List page, and detailed Tabbed View. Enforced strict section-level RBAC for Assembly, Provisioning, QA, and Logistics data.
- **Files changed**:
  - src/domain/types.ts (Added lineId, stationId)
  - src/services/api.ts (Mock service expansion)
  - src/components/ui/design-system.tsx (Added Tooltip)
  - src/pages/Batteries.tsx (List View)
  - src/pages/BatteryDetail.tsx (Detail View with Action Panel)
  - src/app/patchInfo.ts
- **Manual test checklist**:
  - [ ] Login as CS (Super User) -> Verify all tabs and actions visible.
  - [ ] Login as C2 (Mfg) -> Can see Assembly tab, can click "Mark Rework". Cannot see "Upload EOL".
  - [ ] Login as C3 (QA) -> Can see QA tab, can "Upload EOL" and "Approve".
  - [ ] Login as C5 (BMS) -> Can see Provisioning tab, can "Provision BMS".
  - [ ] Login as C6 (Logistics) -> Can see Logistics tab, can "Dispatch".
  - [ ] Login as C9 (External) -> Only sees Overview + QA tabs. No restricted actions.
  - [ ] Verify "Register" modal on list page works for C2.
- **Rollback instructions**: Restore folder snapshot or revert commits associated with UI_PATCH_BATTERIES_MODULE_RBAC_V1.

## UI_PATCH_RBAC_FIX_BATCH_VISIBILITY_C6_C9_V1
- **Date**: 2024-05-23
- **Summary**: Fixed RBAC policy to allow C6 (Logistics) and C9 (External) access to Batches module. Added BATCHES_DETAIL screen ID for granular control. Restricted tabs and actions for C9 (View Only, limited sections).
- **Files changed**:
  - src/app/patchInfo.ts
  - src/rbac/screenIds.ts
  - src/rbac/policy.ts
  - App.tsx
  - src/pages/Batches.tsx
  - src/pages/BatchDetail.tsx
- **Manual test checklist**:
  - [ ] Login as C6 (Logistics) -> Batches appears in sidebar.
  - [ ] C6 can View Batch List and Details.
  - [ ] C6 can Edit Supplier Lots (only), other fields read-only.
  - [ ] Login as C9 (External) -> Batches appears in sidebar.
  - [ ] C9 sees limited Batch Detail (Overview, QA only).
  - [ ] C9 cannot see Supplier Lots, Product Spec, or Production tabs.
- **Rollback instructions**: Restore folder snapshot or revert commits associated with UI_PATCH_RBAC_FIX_BATCH_VISIBILITY_C6_C9_V1.

## UI_PATCH_BATCHES_FORM_RBAC_V2
- **Date**: 2024-05-23
- **Summary**: Upgraded Batches module with detailed domain model, role-gated actions (Create, Edit, Hold, Release, Close), and 2-step approval workflows. Added Batch Detail view with tabs.
- **Files changed**:
  - src/app/patchInfo.ts
  - src/domain/types.ts
  - src/services/api.ts
  - src/pages/Batches.tsx
  - src/pages/BatchDetail.tsx
  - App.tsx
- **Manual test checklist**:
  - [ ] Login as Super User (CS) -> Verify full access to create, edit all sections, force close.
  - [ ] Login as Production Mgr (C2) -> Create batch, Edit header/BOM, Request Hold, Request Close.
  - [ ] Login as QA Mgr (C3) -> Edit QA section, Approve Hold, Approve Close.
  - [ ] Login as Logistics (C6) -> Edit Supplier Lots only.
  - [ ] Login as External (C9) -> View only, limited tabs (no Supplier Lots).
  - [ ] Verify 2-step Close: Prod requests -> QA approves -> Status becomes CLOSED.
- **Rollback instructions**: Restore folder snapshot or revert commits associated with UI_PATCH_BATCHES_FORM_RBAC_V2.

## UI_PATCH_SUPERUSER_FULL_ACCESS_V1
- **Date**: 2024-05-23
- **Summary**: Added "CS" Super User cluster and "SUPER_ADMIN" role with bypassed permission checks (full access). Updated RBAC Admin view to reflect super user status.
- **Files changed**:
  - src/app/patchInfo.ts
  - src/rbac/clusters.ts
  - src/rbac/roleCatalog.ts
  - src/rbac/can.ts
  - src/pages/RbacAdmin.tsx
  - src/components/Layout.tsx
- **Manual test checklist**:
  - [ ] Login as "CS Super User (Full Access)".
  - [ ] Verify all sidebar groups (Operate, Assure, etc.) are visible.
  - [ ] Verify access to restricted pages (e.g., Compliance, Admin) works.
  - [ ] Check "Admin > Access Control" shows "Super User Mode" with all permissions active.
  - [ ] Verify other roles (C1..C9) still work with restricted access.
- **Rollback instructions**: Restore folder snapshot or revert commits associated with UI_PATCH_SUPERUSER_FULL_ACCESS_V1.

## UI_PATCH_LOGIN_ROLE_SELECTOR_V1
- **Date**: 2024-05-23
- **Summary**: Implemented mock authentication flow, role selection screen, and landing page redirection logic. Added AuthGate for route protection and persisted session state.
- **Files changed**:
  - src/app/patchInfo.ts
  - src/lib/store.ts
  - src/rbac/landing.ts
  - src/components/AuthGate.tsx
  - src/pages/Login.tsx
  - App.tsx
  - src/components/Layout.tsx
  - src/pages/RbacAdmin.tsx
- **Manual test checklist**:
  - [ ] Open app fresh (incognito) -> redirected to /login
  - [ ] Select "C2 Manufacturing" -> "Production Manager" -> Enter.
  - [ ] Verify redirection to Batches page (or first allowed page).
  - [ ] Verify "Switch Role" button in top bar navigates to Login.
  - [ ] Verify "Logout" button clears session and goes to Login.
  - [ ] Check Access Control page shows current session correctly.
- **Rollback instructions**: Restore folder snapshot or revert commits associated with UI_PATCH_LOGIN_ROLE_SELECTOR_V1.

## UI_PATCH_RBAC9_ONE_SHOT
- **Date**: 2024-05-23
- **Summary**: Implemented comprehensive 9-cluster RBAC system (C1-C9), role catalog, policy matrix, and route guards. Added RBAC Admin View for auditing.
- **Files changed**:
  - src/app/patchInfo.ts
  - src/rbac/* (verbs, clusters, roleCatalog, screenIds, policy, can)
  - src/lib/store.ts
  - src/components/Layout.tsx
  - src/components/RouteGuard.tsx
  - src/pages/RbacAdmin.tsx
  - src/pages/Placeholder.tsx
  - App.tsx
- **Manual test checklist**:
  - [ ] Verify version footer shows patch ID.
  - [ ] Switch roles using the enhanced dropdown in the header.
  - [ ] Verify C1 (Exec) can see dashboards but not edit.
  - [ ] Verify C2 (Mfg) sees Batches/Provisioning.
  - [ ] Verify C6 (Logistics) sees Inventory/Dispatch.
  - [ ] Access "Admin > RBAC View" to see the policy matrix.
  - [ ] Try to access a restricted URL directly to test RouteGuard.
- **Rollback instructions**: Revert to the previous commit or restore the project state before this patch.