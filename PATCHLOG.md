
# Patch Log

## UI_PATCH_J_SCENARIO_SWITCHER_V1
- **Date**: 2024-05-24
- **Summary**: Implemented a global Demo Scenario Switcher to ensure coherent mock data states across different demo flows.
  - **Scenario Store**: Added `scenarioStore.ts` as the orchestrator for wiping and reseeding mock data.
  - **Happy Path**: Pre-seeds a complete manufacturing cycle with active SKUs, lots, sealed modules, and finalized packs.
  - **Mismatch Gaps**: Seeds a module with missing cell counts (14/16) to demonstrate binding rule enforcement.
  - **Audit Tamper**: Seeds duplicate cell serials across two modules and marks the resulting pack as QC FAIL/Quarantined.
  - **Empty Slate**: Wipes all assets to demonstrate clean empty states.
  - **UI Integration**: Added a scenario dropdown to the top bar for instant switching. Added persistent banners in the diagnostic mode to indicate current scenario context.
- **Files changed**:
  - src/demo/scenarioStore.ts
  - src/demo/scenarios/happyPath.ts
  - src/demo/scenarios/mismatch.ts
  - src/demo/scenarios/tamper.ts
  - src/demo/scenarios/empty.ts
  - src/components/Layout.tsx
  - src/app/patchInfo.ts

## UI_PATCH_I_TRACE_SEARCH_EXPORT_V1
- **Date**: 2024-05-24
... (existing logs) ...
