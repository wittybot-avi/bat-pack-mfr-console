/**
 * PATCH REGISTRY SYSTEM
 * Stable Patch P-056H9
 */

export interface PatchMetadata {
  id: string;
  name: string;
  date: string;
  description: string;
  type: 'foundation' | 'feature' | 'hotfix';
}

export const APP_VERSION = '1.8.10';

export const BUILD_STAMP = "P-056H9_ALIAS_ERADICATION_20240524_2400";

export const CURRENT_PATCH: PatchMetadata = {
  id: "P-056H9",
  name: "ALIAS_ERADICATION_FINAL",
  date: "2024-05-24",
  description: "Total eradication of path aliases (@components, @rbac, @src) to ensure browser-native ESM compatibility across all build contexts.",
  type: "hotfix"
};

export const PATCH_LEVEL = '56H9';
export const LAST_PATCH_ID = CURRENT_PATCH.id;

export const PATCH_HISTORY: PatchMetadata[] = [
  CURRENT_PATCH,
  {
    id: "P-056H8",
    name: "ALIAS_PURGE_COMPLETE",
    date: "2024-05-24",
    description: "Total removal of @ alias specifiers and correction of relative path depth in pages directory.",
    type: "hotfix"
  }
];