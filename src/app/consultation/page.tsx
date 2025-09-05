"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface StudentApplicationForm {
  // 학생 입력 필드 (13개)
  student_name: string;
  gender: string;
  phone: string;
  birth_date: string;
  address: string;
  preferred_practice_date: string;
  grade_report_date: string;
  preferred_semester: string;
  practice_type: string;
  preferred_day: string;
  advisor_name: string;
  car_available: string;
  cash_receipt_number: string;
}

export default function StudentApplicationForm() {
  const [formData, setFormData] = useState<StudentApplicationForm>({
    student_name: "",
    gender: "",
    phone: "",
    birth_date: "",
    address: "",
    preferred_practice_date: "",
    grade_report_date: "",
    preferred_semester: "",
    practice_type: "",
    preferred_day: "",
    advisor_name: "",
    car_available: "",
    cash_receipt_number: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 전화번호 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    const oldValue = formData.phone;

    // 숫자만 추출
    let value = e.target.value.replace(/[^0-9]/g, "");

    // 11자리 제한
    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    // 포맷팅 적용
    let formattedValue = "";
    if (value.length >= 7) {
      formattedValue =
        value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7);
    } else if (value.length >= 3) {
      formattedValue = value.slice(0, 3) + "-" + value.slice(3);
    } else {
      formattedValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      phone: formattedValue,
    }));

    // 커서 위치 조정 (하이픈 위치 고려)
    setTimeout(() => {
      let newCursorPosition = cursorPosition;

      // 하이픈이 추가되면서 커서 위치가 변경된 경우 조정
      if (formattedValue.length > oldValue.length) {
        // 하이픈이 추가된 경우
        if (cursorPosition === 3 && formattedValue[3] === "-") {
          newCursorPosition = 4;
        } else if (cursorPosition === 8 && formattedValue[8] === "-") {
          newCursorPosition = 9;
        }
      } else if (formattedValue.length < oldValue.length) {
        // 하이픈이 제거된 경우
        if (oldValue[cursorPosition] === "-") {
          newCursorPosition = cursorPosition;
        }
      }

      // 최대 길이를 넘지 않도록 조정
      newCursorPosition = Math.min(newCursorPosition, formattedValue.length);

      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // 날짜 포맷팅 함수 (YYYY-MM-DD를 YY.MM.DD로 변환)
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // 날짜 포맷팅 함수 (YYYY-MM-DD를 YY년 MM월 DD일로 변환)
  const formatDateForDisplayKorean = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}년 ${month}월 ${day}일`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("");

    try {
      // Supabase 연결 테스트
      console.log("Testing Supabase connection...");
      const { data: testData, error: testError } = await supabase
        .from("student_applications")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("Supabase connection test failed:", testError);
        throw new Error(`데이터베이스 연결 오류: ${testError.message}`);
      }

      console.log("Supabase connection successful");

      // 20개 컬럼으로 확장된 데이터 객체
      const applicationData = {
        // 학생 입력 필드 (13개) - 날짜 필드들을 포맷팅하여 저장
        ...formData,
        birth_date: formatDateForDisplay(formData.birth_date),
        preferred_practice_date: formatDateForDisplayKorean(
          formData.preferred_practice_date
        ),

        // 실습담당자 수정 필드 (7개) - 담당자가 나중에 수정할 필드들
        practice_manager: null, // 실습담당자
        practice_period: null, // 실습인정기간
        practice_education_center: null, // 실습교육원
        practice_institution: null, // 현장실습기관
        consultation_content: null, // 상담내용
        special_notes: null, // 특이사항
        service_payment_status: null, // 서비스비용 입금여부
      };

      const { data, error } = await supabase
        .from("student_applications") // 테이블명
        .insert([applicationData])
        .select();

      console.log("Application data being sent:", applicationData);
      console.log("Supabase response:", { data, error });

      if (error) {
        throw error;
      }

      setSubmitStatus("✅ 실습신청이 성공적으로 제출되었습니다!");
      setFormData({
        student_name: "",
        gender: "",
        phone: "",
        birth_date: "",
        address: "",
        preferred_practice_date: "",
        grade_report_date: "",
        preferred_semester: "",
        practice_type: "",
        preferred_day: "",
        advisor_name: "",
        car_available: "",
        cash_receipt_number: "",
      });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      setSubmitStatus(`❌ 오류가 발생했습니다: ${error?.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">실습신청서</h1>

        {submitStatus && (
          <div
            className={`mb-6 p-4 rounded-md ${
              submitStatus.includes("✅")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {submitStatus}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학생이름 *
              </label>
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별 *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처 * (010-0000-0000)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                placeholder="010-0000-0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생년월일 *
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거주지 주소 * (전북 00시 00동 00아파트)
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="전북 00시 00동 00아파트"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현장실습 희망날짜 *
              </label>
              <input
                type="date"
                name="preferred_practice_date"
                value={formData.preferred_practice_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성적보고일
              </label>
              <input
                type="date"
                name="grade_report_date"
                value={formData.grade_report_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                희망학기 *
              </label>
              <select
                name="preferred_semester"
                value={formData.preferred_semester}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="26년도 1학기">26년도 1학기</option>
                <option value="26년도 2학기">26년도 2학기</option>
                <option value="27년도 1학기">27년도 1학기</option>
                <option value="27년도 2학기">27년도 2학기</option>
                <option value="28년도 1학기">28년도 1학기</option>
                <option value="28년도 2학기">28년도 2학기</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                실습종류 *
              </label>
              <select
                name="practice_type"
                value={formData.practice_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="현장실습">사회복지사</option>
                <option value="인턴십">보육교사</option>
                <option value="취업연계실습">한국어교원</option>
                <option value="기타">평생교육사</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                희망요일 (8시간고정) *
              </label>
              <select
                name="preferred_day"
                value={formData.preferred_day}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="평일">평일</option>
                <option value="주말">주말</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                에듀바이저스 이름 *
              </label>
              <input
                type="text"
                name="advisor_name"
                value={formData.advisor_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자차여부 *
              </label>
              <select
                name="car_available"
                value={formData.car_available}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option value="O">O</option>
                <option value="X">X</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현금영수증 번호
              </label>
              <input
                type="text"
                name="cash_receipt_number"
                value={formData.cash_receipt_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "제출 중..." : "실습신청 제출"}
          </button>
        </form>
      </div>
    </div>
  );
}
