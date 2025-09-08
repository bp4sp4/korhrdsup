export interface Consultation {
  id: string;
  consultation_type: string;
  consultation_date: string;
  consultant_name: string;
  consultation_content: string;
  attached_file_name?: string;
  attached_file_url?: string;
  attached_file_size?: number;
  member_name?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateConsultationData {
  consultation_type: string;
  consultation_date?: string; // 선택적으로 변경
  consultant_name: string;
  consultation_content: string;
  attached_file_name?: string;
  attached_file_url?: string;
  attached_file_size?: number;
  member_name?: string;
}

export interface UpdateConsultationData {
  consultation_type?: string;
  consultation_date?: string;
  consultant_name?: string;
  consultation_content?: string;
  attached_file_name?: string;
  attached_file_url?: string;
  attached_file_size?: number;
  member_name?: string;
}

export interface Consultant {
  consultant_name: string;
  count: number;
}

export const CONSULTATION_TYPES = ["일반상담", "기술지원", "기타"] as const;

export type ConsultationType = (typeof CONSULTATION_TYPES)[number];
