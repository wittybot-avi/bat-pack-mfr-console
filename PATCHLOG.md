# Patch Log

## UI_PATCH_P44_ASSURE_ROUTING_STABILIZATION_V1 (v1.8.9e)
- **Date**: 2024-05-24
- **Summary**: Stabilized EOL/ASSURE routing, restored Details page, and gated camera permissions.
  - Defined canonical `/assure/eol/...` routes.
  - exhaustive redirects for legacy routes.
  - Implemented S7-compliant `EolDetails.tsx`.
  - Removed global camera permission auto-prompt.

## HOTFIX_P43_ASSURE_ROUTING_MENU_STABILIZATION_V1 (v1.8.9d)
...