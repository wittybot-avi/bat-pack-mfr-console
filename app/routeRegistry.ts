import { matchPath } from 'react-router-dom';
import { ROUTE_LEDGER } from './routeLedger';

/**
 * Validates if the current pathname matches a registered route pattern in the Ledger.
 */
export function isRouteRegistered(pathname: string): boolean {
  return ROUTE_LEDGER.some(r => 
    !!matchPath({ path: r.path, end: true }, pathname)
  );
}

export function checkConsistency() {
  const warnings: string[] = [];
  // Verify all ledger entries have screenId mapping
  ROUTE_LEDGER.forEach(entry => {
      if (!entry.screenId) warnings.push(`[LEDGER_FAIL] Missing ScreenId for: ${entry.path}`);
  });
  return warnings;
}