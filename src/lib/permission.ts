import { PERMISSION, type PermissionLevel } from "@/types";

export function getPermissionLabel(permission: PermissionLevel): string {
  switch (permission) {
    case PERMISSION.SUPER_ADMIN:
      return "최고관리자";
    case PERMISSION.ADMIN:
      return "관리자";
    case PERMISSION.PARTNER:
      return "파트너";
    case PERMISSION.PARTNERSHIP:
      return "협력사";
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

export function isPartner(permission: PermissionLevel): boolean {
  return permission === PERMISSION.PARTNER;
}

export function isPartnership(permission: PermissionLevel): boolean {
  return permission === PERMISSION.PARTNERSHIP;
}

// 파트너(8) + 협력사(7) — 사이드바 파트너 전용 메뉴 표시 대상
export function isPartnerOrPartnership(permission: PermissionLevel): boolean {
  return permission === PERMISSION.PARTNER || permission === PERMISSION.PARTNERSHIP;
}
