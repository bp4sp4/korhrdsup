import { supabase } from "./supabase-client";

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  admin_username: string;
  admin_role_name: string;
  action_type: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  description?: string;
  created_at: string;
}

export interface ActivityStats {
  today: number;
  thisWeek: number;
}

export class AdminLogger {
  /**
   * 관리자 활동 로그를 기록합니다
   */
  static async logActivity(
    adminUserId: string,
    adminUsername: string,
    adminRoleName: string,
    actionType: string,
    tableName: string,
    recordId?: string,
    oldValues?: any,
    newValues?: any,
    description?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .insert({
          admin_user_id: adminUserId,
          admin_username: adminUsername,
          admin_role_name: adminRoleName,
          action_type: actionType,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
          description: description,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select()
        .single();

      if (error) {
        console.error("로그 기록 실패:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("로그 기록 중 오류 발생:", error);
      throw error;
    }
  }

  /**
   * 관리자 활동 로그를 조회합니다
   */
  static async getActivityLogs(
    filters: {
      actionType?: string;
      adminUsername?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      let query = supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false });

      // 필터 적용
      if (filters.actionType) {
        query = query.eq("action_type", filters.actionType);
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("로그 조회 실패:", error);
        throw error;
      }

      // 사용자명 필터 적용 (클라이언트 사이드)
      let filteredData = data || [];
      if (filters.adminUsername) {
        filteredData = filteredData.filter((log: any) =>
          log.admin_username
            .toLowerCase()
            .includes(filters.adminUsername!.toLowerCase())
        );
      }

      return filteredData;
    } catch (error) {
      console.error("로그 조회 중 오류 발생:", error);
      throw error;
    }
  }

  /**
   * 활동 통계를 조회합니다
   */
  static async getActivityStats(): Promise<ActivityStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      // 오늘 활동 수
      const { count: todayCount } = await supabase
        .from("admin_activity_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())
        .lte("created_at", todayEnd.toISOString());

      // 이번 주 활동 수
      const { count: weekCount } = await supabase
        .from("admin_activity_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString());

      return {
        today: todayCount || 0,
        thisWeek: weekCount || 0,
      };
    } catch (error) {
      console.error("통계 조회 중 오류 발생:", error);
      return { today: 0, thisWeek: 0 };
    }
  }

  /**
   * 액션에 대한 설명을 생성합니다
   */
  private static getActionDescription(
    action: string,
    moduleCode: string,
    details: any
  ): string {
    const moduleNames: { [key: string]: string } = {
      consultations: "상담",
      students: "학생",
      institutions: "기관",
      contract_education_centers: "계약교육원",
      users: "사용자",
      posts: "게시글",
    };

    const actionNames: { [key: string]: string } = {
      CREATE: "등록",
      UPDATE: "수정",
      DELETE: "삭제",
      LOGIN: "로그인",
      LOGOUT: "로그아웃",
    };

    const moduleName = moduleNames[moduleCode] || moduleCode;
    const actionName = actionNames[action] || action;

    if (details?.record_name) {
      return `${moduleName} ${actionName}: ${details.record_name}`;
    } else if (details?.record_id) {
      return `${moduleName} ${actionName}: ${moduleName} ID ${details.record_id}`;
    } else {
      return `${moduleName} ${actionName}`;
    }
  }

  /**
   * 특정 사용자의 활동 로그를 조회합니다
   */
  static async getUserActivityLogs(adminUserId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .eq("admin_user_id", adminUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("사용자 로그 조회 실패:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("사용자 로그 조회 중 오류 발생:", error);
      throw error;
    }
  }

  /**
   * 활동 로그를 삭제합니다
   */
  static async deleteActivityLogs(logIds: string[]) {
    try {
      const { error } = await supabase
        .from("admin_activity_logs")
        .delete()
        .in("id", logIds);

      if (error) {
        console.error("로그 삭제 실패:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("로그 삭제 중 오류 발생:", error);
      throw error;
    }
  }
}
