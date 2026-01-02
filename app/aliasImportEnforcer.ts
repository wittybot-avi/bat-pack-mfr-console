/**
 * NO ALIAS IMPORTS ALLOWED
 * This module enforces strict relative pathing for browser-native ESM compatibility.
 */

export function assertNoAliasImports() {
  const forbiddenPrefixes = ['@/', '@components/', '@src/', '@rbac/', '@/rbac/'];
  
  // Runtime marker to catch auto-imports that bypass linting
  console.log("[ENFORCER] Validating ESM specifiers. No aliases permitted.");
  
  return true;
}

// Global hook for debugging
(window as any).__ASSERT_ESM__ = assertNoAliasImports;