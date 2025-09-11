// 관리자 권한 관련 타입 정의

export interface AdminRole {
  id: number;
  role_name: string;
  role_level: number;
  description: string;
  permissions: AdminPermissions;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role_id: number;
  role?: AdminRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPermissions {
  can_manage_users: boolean;
  can_manage_institutions: boolean;
  can_manage_students: boolean;
  can_manage_contract_centers: boolean;
  can_view_all_data: boolean;
  can_export_data: boolean;
  can_delete_data: boolean;
  can_add_data: boolean;
  can_edit_data: boolean;
  can_modify_system_settings: boolean;
}

export interface AdminAuthState {
  user: AdminUser | null;
  role: AdminRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 권한 레벨 상수
export const ADMIN_ROLE_LEVELS = {
  SUPER_ADMIN: 1, // 최고관리자
  ADMIN: 2, // 그다음관리자
} as const;

export type AdminRoleLevel =
  (typeof ADMIN_ROLE_LEVELS)[keyof typeof ADMIN_ROLE_LEVELS];
