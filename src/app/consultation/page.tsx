"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

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
  const router = useRouter();

  const [formData, setFormData] = useState<StudentApplicationForm>({
    student_name: "",
    gender: "",
    phone: "",
    birth_date: "", // 기본값을 빈 문자열로 설정
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
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<string>("");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [cashReceiptError, setCashReceiptError] = useState<string>("");
  const [tempDate, setTempDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });

  // 연락처 번호를 현금영수증번호에 복사하는 함수
  const copyPhoneToCashReceipt = () => {
    const phone = formData.phone.trim();
    if (phone) {
      setFormData((prev) => ({
        ...prev,
        cash_receipt_number: phone,
      }));
      setCashReceiptError("연락처 번호가 복사되었습니다.");
    }
  };

  // 필수 필드 검증 함수
  const isFormValid = () => {
    const requiredFields = [
      "student_name",
      "gender",
      "phone",
      "birth_date",
      "address",
      "preferred_practice_date",
      "preferred_semester",
      "practice_type",
      "preferred_day",
      "advisor_name",
      "car_available",
      "cash_receipt_number",
    ];

    const fieldsValid = requiredFields.every((field) => {
      const value = formData[field as keyof StudentApplicationForm];
      return value && value.trim() !== "";
    });

    return fieldsValid && privacyAgreed;
  };

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

  // 모바일 날짜 선택기 열기
  const openDatePicker = (fieldName: string) => {
    const currentValue = formData[fieldName as keyof StudentApplicationForm];
    if (currentValue) {
      const date = new Date(currentValue);
      setTempDate({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      });
    }
    setCurrentDateField(fieldName);
    setShowDatePicker(true);
  };

  // 모바일 날짜 선택기 닫기
  const closeDatePicker = () => {
    setShowDatePicker(false);
    setCurrentDateField("");
  };

  // 날짜 적용
  const applyDate = () => {
    const dateString = `${tempDate.year}-${tempDate.month
      .toString()
      .padStart(2, "0")}-${tempDate.day.toString().padStart(2, "0")}`;
    setFormData((prev) => ({
      ...prev,
      [currentDateField]: dateString,
    }));
    closeDatePicker();
  };

  // 년도 배열 생성
  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 50; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // 월 배열 생성
  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // 일 배열 생성
  const generateDays = () => {
    const daysInMonth = new Date(tempDate.year, tempDate.month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
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

      setShowSuccessModal(true);
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
    <div className="min-h-screen bg-white">
      <Header />

      {/* 모바일 UI 개선을 위한 CSS */}
      <style jsx global>{`
        /* 모바일에서 입력 필드들의 최소 너비 설정 */
        @media (max-width: 768px) {
          .mobile-input {
            min-width: 100%;
            max-width: 100%;
          }

          /* 모바일에서 그리드 간격 조정 */
          .mobile-grid {
            gap: 1rem;
          }

          /* 모바일 날짜 선택 버튼 스타일 */
          button[type="button"] {
            transition: all 0.2s ease;
          }

          button[type="button"]:active {
            transform: scale(0.98);
          }
        }
      `}</style>

      {/* 메인 컨텐츠 */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8">실습신청서</h1>

          {submitStatus && !submitStatus.includes("✅") && (
            <div className="mb-6 p-4 rounded-md bg-red-100 text-red-800">
              {submitStatus}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  학생이름 *
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  성별 *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                >
                  <option value="">선택하세요</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  연락처 * (010-0000-0000)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  생년월일 *
                </label>
                {/* 데스크톱용 날짜 입력 */}
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  min="1960-01-01"
                  max="2010-12-31"
                  required
                  className="hidden md:block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                {/* 모바일용 날짜 선택 버튼 */}
                <button
                  type="button"
                  onClick={() => openDatePicker("birth_date")}
                  className="md:hidden w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-left bg-white"
                >
                  {formData.birth_date
                    ? formatDateForDisplay(formData.birth_date)
                    : "생년월일을 선택하세요"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                거주지 주소 * (전북 00시 00동 00아파트)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="전북 00시 00동 00아파트"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  현장실습 희망날짜 *
                </label>
                {/* 데스크톱용 날짜 입력 */}
                <input
                  type="date"
                  name="preferred_practice_date"
                  value={formData.preferred_practice_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  max="2030-12-31"
                  required
                  className="hidden md:block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                {/* 모바일용 날짜 선택 버튼 */}
                <button
                  type="button"
                  onClick={() => openDatePicker("preferred_practice_date")}
                  className="md:hidden w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-left bg-white"
                >
                  {formData.preferred_practice_date
                    ? formatDateForDisplay(formData.preferred_practice_date)
                    : "희망날짜를 선택하세요"}
                </button>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  성적보고일 *
                </label>
                {/* 데스크톱용 날짜 입력 */}
                <input
                  type="date"
                  name="grade_report_date"
                  value={formData.grade_report_date}
                  onChange={handleInputChange}
                  className="hidden md:block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                {/* 모바일용 날짜 선택 버튼 */}
                <button
                  type="button"
                  onClick={() => openDatePicker("grade_report_date")}
                  className="md:hidden w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-left bg-white"
                >
                  {formData.grade_report_date
                    ? formatDateForDisplay(formData.grade_report_date)
                    : "성적보고일을 선택하세요"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  희망학기 *
                </label>
                <select
                  name="preferred_semester"
                  value={formData.preferred_semester}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
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
                <label className="block text-base font-medium text-gray-700 mb-2">
                  실습종류 *
                </label>
                <select
                  name="practice_type"
                  value={formData.practice_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                >
                  <option value="">선택하세요</option>
                  <option value="사회복지사 실습 160시간">
                    사회복지사 실습 160시간
                  </option>
                  <option value="사회복지사 실습 120시간">
                    사회복지사 실습 120시간
                  </option>
                  <option value="보육교사 실습 240시간">
                    보육교사 실습 240시간
                  </option>
                  <option value="평생교육사 실습 160시간">
                    평생교육사 실습 160시간
                  </option>
                  <option value="한국어교원 실습">한국어교원 실습</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  희망요일 (8시간고정) *
                </label>
                <select
                  name="preferred_day"
                  value={formData.preferred_day}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                >
                  <option value="">선택하세요</option>
                  <option value="평일">평일</option>
                  <option value="주말">주말</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  에듀바이저스 이름 *
                </label>
                <input
                  type="text"
                  name="advisor_name"
                  value={formData.advisor_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-grid">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  자차여부 *
                </label>
                <select
                  name="car_available"
                  value={formData.car_available}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                >
                  <option value="">선택하세요</option>
                  <option value="O">O</option>
                  <option value="X">X</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  현금영수증 번호 *
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    name="cash_receipt_number"
                    value={formData.cash_receipt_number}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base mobile-input"
                  />
                  {formData.phone.trim() && (
                    <div className="flex flex-col sm:items-end">
                      <button
                        type="button"
                        onClick={copyPhoneToCashReceipt}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap w-full sm:w-auto"
                      >
                        휴대폰 번호와 같아요
                      </button>
                    </div>
                  )}
                </div>
                {cashReceiptError && (
                  <p
                    className={`text-sm mt-1 ${
                      cashReceiptError.includes("복사되었습니다")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {cashReceiptError}
                  </p>
                )}
              </div>
            </div>

            {/* 필수 필드 안내 메시지 */}
            {!isFormValid() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      모든 항목이 필수 항목입니다.
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        아래 항목들을 모두 입력하셔야 신청서 제출이 가능합니다.
                        <br />
                        혹시 입력 중 모르는 부분이 있으시면 에듀바이저
                        담당자에게 문의해 주시기 바랍니다.
                      </p>
                      <ul className="mt-1 list-disc list-inside">
                        {!formData.student_name && <li>학생이름</li>}
                        {!formData.gender && <li>성별</li>}
                        {!formData.phone && <li>연락처</li>}
                        {!formData.birth_date && <li>생년월일</li>}
                        {!formData.address && <li>거주지 주소</li>}
                        {!formData.preferred_practice_date && (
                          <li>현장실습 희망날짜</li>
                        )}
                        {!formData.preferred_semester && <li>희망학기</li>}
                        {!formData.practice_type && <li>실습종류</li>}
                        {!formData.preferred_day && <li>희망요일</li>}
                        {!formData.advisor_name && <li>에듀바이저스 이름</li>}
                        {!formData.car_available && <li>자차여부</li>}
                        {!formData.cash_receipt_number && (
                          <li>현금영수증 번호</li>
                        )}
                        {!privacyAgreed && <li>개인정보 수집 및 이용동의</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 개인정보 수집 및 이용동의 */}
            <div className="mb-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="privacy-agreement"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label
                    htmlFor="privacy-agreement"
                    className="text-sm text-gray-700"
                  >
                    <span className="text-red-500">*</span> 개인정보 수집 및
                    이용에 동의합니다.{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      개인정보동의
                    </button>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className={`w-full py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isFormValid() && !isSubmitting
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "제출 중..." : "실습신청 제출"}
            </button>
          </form>
        </div>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed bg-[#00000080] inset-0 border flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              신청 완료!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              실습신청이 성공적으로 제출되었습니다.
              <br />
              담당자가 확인 후 연락드리겠습니다.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                확인
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/");
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 날짜 선택기 */}
      {showDatePicker && (
        <div className="fixed inset-0  flex items-end z-50 md:hidden">
          <div className="bg-white rounded-t-lg w-full max-h-[70vh] overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                {currentDateField === "birth_date" && "생년월일 선택"}
                {currentDateField === "preferred_practice_date" &&
                  "희망날짜 선택"}
                {currentDateField === "grade_report_date" && "성적보고일 선택"}
              </h3>
              <button
                onClick={closeDatePicker}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* 날짜 선택 영역 */}
            <div className="p-4">
              <div className="flex justify-center space-x-4 mb-6">
                {/* 년도 선택 */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    년도
                  </label>
                  <div className="h-32 overflow-y-auto border rounded-md">
                    {generateYears().map((year) => (
                      <div
                        key={year}
                        className={`p-2 text-center cursor-pointer hover:bg-gray-100 ${
                          tempDate.year === year
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : ""
                        }`}
                        onClick={() =>
                          setTempDate((prev) => ({ ...prev, year }))
                        }
                      >
                        {year}년
                      </div>
                    ))}
                  </div>
                </div>

                {/* 월 선택 */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    월
                  </label>
                  <div className="h-32 overflow-y-auto border rounded-md">
                    {generateMonths().map((month) => (
                      <div
                        key={month}
                        className={`p-2 text-center cursor-pointer hover:bg-gray-100 ${
                          tempDate.month === month
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : ""
                        }`}
                        onClick={() =>
                          setTempDate((prev) => ({ ...prev, month }))
                        }
                      >
                        {month}월
                      </div>
                    ))}
                  </div>
                </div>

                {/* 일 선택 */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일
                  </label>
                  <div className="h-32 overflow-y-auto border rounded-md">
                    {generateDays().map((day) => (
                      <div
                        key={day}
                        className={`p-2 text-center cursor-pointer hover:bg-gray-100 ${
                          tempDate.day === day
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : ""
                        }`}
                        onClick={() =>
                          setTempDate((prev) => ({ ...prev, day }))
                        }
                      >
                        {day}일
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 선택된 날짜 표시 */}
              <div className="text-center mb-4 p-3 bg-gray-50 rounded-md">
                <span className="text-lg font-semibold">
                  {tempDate.year}년 {tempDate.month}월 {tempDate.day}일
                </span>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={closeDatePicker}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={applyDate}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보동의 팝업 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                개인정보 수집 및 이용 동의
              </h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">
                  1. 개인정보 수집 및 이용 목적
                </h3>
                <p>실습 신청 및 관리, 상담 서비스 제공, 실습 기관 배정</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  2. 수집하는 개인정보 항목
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>이름, 성별, 연락처, 생년월일, 주소</li>
                  <li>
                    희망실습일, 희망학기, 실습종류, 희망요일, 에듀바이저,
                    자차사용여부, 현금영수증번호
                  </li>
                </ul>
                <p className="text-red-600 font-medium mt-2">
                  ※ 모든 항목은 필수 입력 사항입니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  3. 개인정보 보유 및 이용 기간
                </h3>
                <p>실습 완료 후 3년간 보관 (관련 법령에 따라 보관)</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. 개인정보 제3자 제공</h3>
                <p>실습 기관 배정을 위한 실습 기관에만 제공</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  5. 개인정보 처리 거부 권리
                </h3>
                <p>
                  개인정보 수집 및 이용에 동의하지 않을 수 있으나, 이 경우 실습
                  신청이 제한될 수 있습니다.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
