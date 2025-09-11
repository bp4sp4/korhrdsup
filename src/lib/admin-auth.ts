import { supabase } from "./supabase-client";
import { AdminUser, AdminRole, AdminAuthState } from "@/types/admin";

export class AdminAuth {
  // 관리자 로그인
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
    try {
      // Supabase Auth로 로그인
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "로그인에 실패했습니다." };
      }

      // 관리자 정보 조회
      console.log("Looking for admin user with ID:", authData.user.id);
      console.log("Auth user email:", authData.user.email);

      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select(
          `
          *,
          role:admin_roles(*)
        `
        )
        .eq("id", authData.user.id)
        .eq("is_active", true)
        .single();

      console.log("Admin user query result:", { adminUser, adminError });

      if (adminError || !adminUser) {
        // 일반 사용자이거나 비활성화된 관리자
        console.error("Admin user not found or error:", adminError);
        console.log("Auth user ID:", authData.user.id);
        console.log("Auth user email:", authData.user.email);
        await supabase.auth.signOut();
        return {
          success: false,
          error: "관리자 권한이 없습니다. 관리자에게 문의하세요.",
        };
      }

      // 마지막 로그인 시간 업데이트
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", adminUser.id);

      return { success: true, user: adminUser };
    } catch (error) {
      console.error("Admin login error:", error);
      return { success: false, error: "로그인 중 오류가 발생했습니다." };
    }
  }

  // 관리자 로그아웃
  static async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  // 현재 관리자 정보 조회
  static async getCurrentAdmin(): Promise<AdminUser | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select(
          `
          *,
          role:admin_roles(*)
        `
        )
        .eq("id", user.id)
        .eq("is_active", true)
        .single();

      if (error || !adminUser) return null;

      return adminUser;
    } catch (error) {
      console.error("Error getting current admin:", error);
      return null;
    }
  }

  // 현재 사용자 정보 조회 (로그용)
  static async getCurrentUser(): Promise<{
    id: string;
    name: string;
    position_name: string;
  } | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("getCurrentUser - auth user:", user);
      if (!user) return null;

      // admin_users 테이블에서 사용자 정보 조회
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select(
          `
          *,
          admin_roles!admin_users_role_id_fkey (
            role_name
          )
        `
        )
        .eq("id", user.id)
        .eq("is_active", true)
        .single();

      console.log("getCurrentUser - admin user query result:", {
        adminUser,
        error,
      });

      if (error || !adminUser) return null;

      const result = {
        id: adminUser.id,
        name: adminUser.username,
        position_name: adminUser.admin_roles?.role_name || "알 수 없음",
      };

      console.log("getCurrentUser - returning:", result);
      return result;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  // 권한 체크
  static async hasPermission(
    permission: keyof AdminUser["role"]["permissions"]
  ): Promise<boolean> {
    const admin = await this.getCurrentAdmin();
    if (!admin || !admin.role) return false;

    return admin.role.permissions[permission] === true;
  }

  // 역할 레벨 체크
  static async hasRoleLevel(requiredLevel: number): Promise<boolean> {
    const admin = await this.getCurrentAdmin();
    if (!admin || !admin.role) return false;

    return admin.role.role_level <= requiredLevel;
  }

  // 삭제 권한 체크 (최고관리자만)
  static async canDelete(): Promise<boolean> {
    return await this.hasPermission("can_delete_data");
  }

  // 수정 권한 체크
  static async canEdit(): Promise<boolean> {
    return await this.hasPermission("can_edit_data");
  }

  // 추가 권한 체크
  static async canAdd(): Promise<boolean> {
    return await this.hasPermission("can_add_data");
  }

  // 관리자 상태 조회
  static async getAuthState(): Promise<AdminAuthState> {
    const user = await this.getCurrentAdmin();

    return {
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      isLoading: false,
    };
  }

  // 인증 상태 변경 감지
  static onAuthStateChange(callback: (state: AdminAuthState) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        const state = await this.getAuthState();
        callback(state);
      }
    });
  }
}
