import { createClient } from "./supabase-client";
import {
  Consultation,
  CreateConsultationData,
  UpdateConsultationData,
} from "@/types/consultation";

export class ConsultationService {
  // 상담 목록 조회 (다양한 필터링 옵션)
  static async getConsultations(filters?: {
    consultantName?: string;
    consultationType?: string;
    contentSearch?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Consultation[]> {
    const supabase = createClient();
    let query = supabase
      .from("consultations")
      .select("*")
      .order("consultation_date", { ascending: false });

    if (filters?.consultantName) {
      query = query.eq("consultant_name", filters.consultantName);
    }

    if (filters?.consultationType) {
      query = query.eq("consultation_type", filters.consultationType);
    }

    if (filters?.contentSearch) {
      query = query.ilike("consultation_content", `%${filters.contentSearch}%`);
    }

    if (filters?.startDate) {
      query = query.gte("consultation_date", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("consultation_date", filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("상담 조회 오류:", error);
      throw error;
    }

    return data || [];
  }

  // 상담 생성
  static async createConsultation(
    consultationData: CreateConsultationData
  ): Promise<Consultation> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // 개발 환경에서 임시로 테스트용 사용자 ID 사용
      console.warn("로그인되지 않음. 개발 모드에서 테스트용 사용자 ID 사용");
    }

    if (!consultationData.consultant_name) {
      throw new Error("상담자명은 필수입니다.");
    }

    const { data, error } = await (supabase as any)
      .from("consultations")
      .insert({
        ...consultationData,
        consultation_date: new Date().toISOString(), // 현재 시간으로 자동 설정
        user_id: user?.id || "00000000-0000-0000-0000-000000000000", // 개발용 임시 ID
      })
      .select()
      .single();

    if (error) {
      console.error("상담 생성 오류:", error);
      throw error;
    }

    return data;
  }

  // 상담 수정
  static async updateConsultation(
    id: string,
    consultationData: UpdateConsultationData
  ): Promise<Consultation> {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("consultations")
      .update(consultationData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("상담 수정 오류:", error);
      throw error;
    }

    return data;
  }

  // 상담 삭제
  static async deleteConsultation(id: string): Promise<void> {
    const supabase = createClient();
    console.log("ConsultationService.deleteConsultation 호출 - ID:", id);

    const { data, error } = await supabase
      .from("consultations")
      .delete()
      .eq("id", id)
      .select();

    console.log("삭제 결과 - data:", data, "error:", error);

    if (error) {
      console.error("상담 삭제 오류:", error);
      throw error;
    }

    console.log("상담 삭제 성공 - ID:", id);
  }

  // 상담 통계 조회 (필터링된 통계)
  static async getConsultationStats(filters?: {
    consultantName?: string;
    consultationType?: string;
    contentSearch?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ total: number }> {
    const supabase = createClient();
    let query = supabase
      .from("consultations")
      .select("*", { count: "exact", head: true });

    if (filters?.consultantName) {
      query = query.eq("consultant_name", filters.consultantName);
    }

    if (filters?.consultationType) {
      query = query.eq("consultation_type", filters.consultationType);
    }

    if (filters?.contentSearch) {
      query = query.ilike("consultation_content", `%${filters.contentSearch}%`);
    }

    if (filters?.startDate) {
      query = query.gte("consultation_date", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("consultation_date", filters.endDate);
    }

    const { count, error } = await query;

    if (error) {
      console.error("상담 통계 조회 오류:", error);
      throw error;
    }

    return { total: count || 0 };
  }

  // 상담자 목록 조회
  static async getConsultants(): Promise<
    { consultant_name: string; count: number }[]
  > {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("consultations")
      .select("consultant_name")
      .order("consultant_name");

    if (error) {
      console.error("상담자 목록 조회 오류:", error);
      throw error;
    }

    // 상담자별 통계 계산
    const consultantMap = new Map<string, number>();

    data?.forEach((consultation: any) => {
      const name = consultation.consultant_name;

      if (consultantMap.has(name)) {
        consultantMap.set(name, consultantMap.get(name)! + 1);
      } else {
        consultantMap.set(name, 1);
      }
    });

    return Array.from(consultantMap.entries()).map(
      ([consultant_name, count]) => ({
        consultant_name,
        count,
      })
    );
  }

  // 파일 업로드 (Supabase Storage 사용)
  static async uploadFile(
    file: File
  ): Promise<{ url: string; name: string; size: number }> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // 개발 환경에서 임시로 테스트용 사용자 ID 사용
      console.warn("로그인되지 않음. 개발 모드에서 테스트용 사용자 ID 사용");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${
      user?.id || "00000000-0000-0000-0000-000000000000"
    }/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("consultation-files")
      .upload(fileName, file);

    if (error) {
      console.error("파일 업로드 오류:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("consultation-files").getPublicUrl(fileName);

    return {
      url: publicUrl,
      name: file.name,
      size: file.size,
    };
  }

  // 파일 삭제
  static async deleteFile(fileUrl: string): Promise<void> {
    const supabase = createClient();
    const fileName = fileUrl.split("/").pop();
    if (!fileName) return;

    const { error } = await supabase.storage
      .from("consultation-files")
      .remove([fileName]);

    if (error) {
      console.error("파일 삭제 오류:", error);
      throw error;
    }
  }
}
