# Patch Log

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
