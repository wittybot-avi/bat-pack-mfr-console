/**
 * PATCH REGISTRY SYSTEM
 * Stable Patch P-056H8
 */

export interface PatchMetadata {
  id: string;
  name: string;
  date: string;
  description: string;
  type: 'foundation' | 'feature' | 'hotfix';
}

export const APP_VERSION = '1.8.10';

export const BUILD_STAMP = "P-056H8_ALIAS_PURGE_20240524_2300";

export const CURRENT_PATCH: PatchMetadata = {
  id: "P-056H8",
  name: "ALIAS_PURGE_COMPLETE",
  date: "2024-05-24",
  description: "Total removal of @ alias specifiers and correction of relative path depth in pages directory.",
  type: "hotfix"
};

export const PATCH_LEVEL = '56H8';
export const LAST_PATCH_ID = CURRENT_PATCH.id;

export const PATCH_HISTORY: PatchMetadata[] = [
  CURRENT_PATCH,
  {
    id: "P-056H7",
    name: "ALIAS_ERADICATION_SWEEP",
    date: "2024-05-24",
    description: "Total eradication of path aliases (@components, @rbac, @src).",
    type: "hotfix"
  }
];