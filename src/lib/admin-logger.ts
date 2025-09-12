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
   * 변경된 필드들을 비교하여 반환합니다
   */
  static getChangedFields(
    oldValues: any,
    newValues: any
  ): Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }> {
    if (!oldValues || !newValues) return [];

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    // 시스템 필드들 (변경 추적에서 제외)
    const systemFields = new Set([
      "id",
      "created_at",
      "updated_at",
      "admin_user_id",
      "admin_username",
      "admin_role_name",
      "action_type",
      "table_name",
      "record_id",
      "ip_address",
      "user_agent",
      "description",
    ]);

    // 모든 키를 확인 (oldValues와 newValues 모두)
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    for (const key of allKeys) {
      // 시스템 필드는 제외
      if (systemFields.has(key)) continue;

      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];

      // null, undefined, 빈 문자열을 동일하게 처리
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined || val === "") return null;
        return val;
      };

      const normalizedOldVal = normalizeValue(oldVal);
      const normalizedNewVal = normalizeValue(newVal);

      // 값이 다르면 변경된 것으로 간주
      if (normalizedOldVal !== normalizedNewVal) {
        changes.push({
          field: key,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }

    return changes;
  }

  /**
   * 필드명을 한국어로 변환합니다
   */
  static getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      name: "이름",
      status: "상태",
      email: "이메일",
      phone: "전화번호",
      address: "주소",
      description: "설명",
      created_at: "생성일",
      updated_at: "수정일",
      admin_user_id: "관리자 ID",
      admin_username: "관리자명",
      admin_role_name: "관리자 역할",
      action_type: "액션 타입",
      table_name: "테이블명",
      record_id: "레코드 ID",
      ip_address: "IP 주소",
      user_agent: "사용자 에이전트",
      // 계약교육원 관련 필드들
      center_name: "교육원명",
      center_type: "교육원 유형",
      contact_person: "담당자",
      contact_phone: "담당자 전화번호",
      contact_email: "담당자 이메일",
      business_number: "사업자번호",
      address_detail: "상세주소",
      postal_code: "우편번호",
      region: "지역",
      is_active: "활성 상태",
      contract_start_date: "계약 시작일",
      contract_end_date: "계약 종료일",
      // 학생 관련 필드들
      student_name: "학생명",
      student_id: "학생 ID",
      birth_date: "생년월일",
      gender: "성별",
      school_name: "학교명",
      grade: "학년",
      parent_name: "부모명",
      parent_phone: "부모 전화번호",
      parent_email: "부모 이메일",
      // 기관 관련 필드들
      institution_name: "기관명",
      institution_type: "기관 유형",
      director_name: "원장명",
      director_phone: "원장 전화번호",
      director_email: "원장 이메일",
      // 상담 관련 필드들
      consultation_type: "상담 유형",
      consultation_date: "상담일",
      consultation_time: "상담 시간",
      consultation_status: "상담 상태",
      consultation_content: "상담 내용",
      consultation_result: "상담 결과",
      counselor_name: "상담사명",
      counselor_phone: "상담사 전화번호",
      counselor_email: "상담사 이메일",
    };

    return fieldNames[fieldName] || fieldName;
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
