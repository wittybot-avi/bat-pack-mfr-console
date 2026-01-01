
# Patch Notes: UI Hardening & Safety Nets (L)

## Key Changes
- **Global Error Boundary**: The app now captures runtime crashes. Instead of a white screen, a detailed recovery UI appears.
- **Cache Management**: Added a "Hard Reset" feature in the Error Boundary to recover from corrupt scenario states.
- **Scenario Switching Guard**: Switching scenarios now includes a transition state, validation for the scenario ID, and a safe landing on the dashboard.
- **Diagnostic Bundles**: One-click "Copy Diagnostics" for troubleshooting.
- **Consistent Visuals**: Loading skeletons and descriptive empty states added to primary manufacturing modules.

## How to Test Fallback
1. To see the Error Boundary, manually throw an error in any render method (Dev only).
2. Or, navigate to a deep link (e.g., specific batch ID) and switch to the "EMPTY" scenario. If the asset is missing, the app should safely recover via the NotFound page or Error Boundary if a dependency fails.

## Collecting Diagnostics
If the app crashes:
1. Click "Copy Diagnostic Bundle" in the error UI.
2. The bundle includes: current path, active role, current demo scenario, error stack, and system version.
