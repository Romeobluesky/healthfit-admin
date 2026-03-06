import { PERMISSION, type PermissionLevel } from "@/types";

export function getPermissionLabel(permission: PermissionLevel): string {
  switch (permission) {
    case PERMISSION.SUPER_ADMIN:
      return "최고관리자";
    case PERMISSION.ADMIN:
      return "관리자";
    case PERMISSION.PARTNER:
      return "파트너";
    default:
      return "알 수 없음";
  }
}

export function isAdmin(permission: PermissionLevel): boolean {
  return permission >= PERMISSION.ADMIN;
}

export function isSuperAdmin(permission: PermissionLevel): boolean {
  return permission >= PERMISSION.SUPER_ADMIN;
}
