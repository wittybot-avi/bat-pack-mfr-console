# Patch P33: Workflow Guardrails (Enforcement & Guidance)

## Overview
This patch transitions the application from a "free-form" data tool to a governed manufacturing system. It ensures that operations follow a strict sequence of events based on the status of assets and the role of the user.

## Key Rules Implemented

### 1. SKU Activation
- **Rule**: A production batch cannot be created from a SKU that is in `DRAFT` status.
- **Enforcement**: "Create Mfg Batch" button on SKU Detail is disabled with a tooltip: "Blueprint must be ACTIVATED before production use."
- **Next Step**: Users are guided to the "Activate Spec" button if they have Engineering (C4) permissions.

### 2. Module Assembly
- **Rule**: A module cannot be "Sealed" until the bound cell count matches the target count defined in the SKU.
- **Enforcement**: "Seal Module" button is locked. Tooltip displays: "Requires X cells (Y found)".
- **Next Step**: Guides the operator to link to a Pack Build once sealed.

### 3. Pack Assembly QC
- **Rule**: A pack cannot be released to the EOL station until modules are complete, BMS is bound, and the Assembly QC check is marked "PASSED".
- **Enforcement**: "Finalize & Release" button is hidden or disabled until these 4 conditions are met.

### 4. EOL Decision Gating
- **Rule**: A QA analyst cannot mark a pack as "Certified PASS" or "Quarantined" if the test checklist is incomplete.
- **Enforcement**: Operational disposition controls are hidden until all required test parameters have measurements.

## Guided Experience
Added a **"Next Recommended Action"** panel to core screens. 
Example paths:
1. Sku (Draft) -> **Activate Blueprint**
2. Sku (Active) -> **Start Production Batch**
3. Module (Sealing) -> **Link to Pack Build**
4. Pack (Sealed) -> **Commence EOL Test**

## Visual Standardization
- All status labels now use a consistent set: DRAFT, ACTIVE, IN PROGRESS, BLOCKED, COMPLETED, FAILED.
- Primary actions always explain state prerequisites via Tooltips.

## Future Scaling
The logic is centralized in `src/services/workflowGuardrails.ts`. To add a new rule, simply append to the `getGuardrail` methods or update the `NextStep` calculator.