# Patch Log

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
