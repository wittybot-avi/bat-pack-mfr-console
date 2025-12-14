import { RBAC_POLICY } from './policy';
import { ScreenId } from './screenIds';
import { PermissionVerb } from './verbs';

export function canView(clusterId: string, screen: ScreenId): boolean {
  const perms = RBAC_POLICY[clusterId]?.[screen];
  return !!perms && perms.includes('V');
}

export function canDo(clusterId: string, screen: ScreenId, verb: PermissionVerb): boolean {
  const perms = RBAC_POLICY[clusterId]?.[screen];
  return !!perms && perms.includes(verb);
}

export function getMyPermissions(clusterId: string, screen: ScreenId): PermissionVerb[] {
  return RBAC_POLICY[clusterId]?.[screen] || [];
}