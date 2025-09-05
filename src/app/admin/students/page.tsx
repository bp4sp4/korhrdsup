"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Student {
  id: string;
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
  practice_manager: string | null;
  practice_period: string | null;
  practice_education_center: string | null;
  practice_institution: string | null;
  consultation_content: string | null;
  special_notes: string | null;
  service_payment_status: string | null;
  payment_status: string;
  practice_completion_status: string;
  created_at: string;
  updated_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<
    "pending" | "completed" | "refunded"
  >("pending");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 필터링 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    student_name: "",
    gender: "",
    practice_type: "",
    preferred_semester: "",
    preferred_day: "",
    car_available: "",
    practice_manager: "",
    service_payment_status: "",
    created_at_from: "",
    created_at_to: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("student_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "학생 데이터를 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm(student);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingStudent) return;

    try {
      const { error } = await supabase
        .from("student_applications")
        .update(editForm)
        .eq("id", editingStudent.id);

      if (error) throw error;

      // 데이터 새로고침
      await fetchStudents();
      setEditingStudent(null);
      setEditForm({});
      setShowEditModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    }
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setEditForm({});
    setShowEditModal(false);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  // 필터링된 데이터
  const filteredStudents = students.filter((student) => {
    // 탭별 필터링
    let matchesTab = false;
    if (activeTab === "pending") {
      // 관리대기: 입금 상태가 pending이거나 paid인 학생들 (실습완료되지 않은)
      matchesTab =
        student.payment_status !== "refunded" &&
        student.practice_completion_status !== "completed";
    } else if (activeTab === "completed") {
      // 실습완료: 실습을 완료한 학생들
      matchesTab = student.practice_completion_status === "completed";
    } else if (activeTab === "refunded") {
      // 환불완료: 환불된 학생들
      matchesTab = student.payment_status === "refunded";
    }

    const matchesSearch =
      !searchTerm ||
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.practice_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.preferred_semester
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (student.practice_manager &&
        student.practice_manager
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;

      if (key === "created_at_from" || key === "created_at_to") {
        if (!value) return true;
        const studentDate = new Date(student.created_at);
        const filterDate = new Date(value);

        if (key === "created_at_from") {
          return studentDate >= filterDate;
        } else {
          return studentDate <= filterDate;
        }
      }

      return student[key as keyof Student]
        ?.toString()
        .toLowerCase()
        .includes(value.toLowerCase());
    });

    return matchesTab && matchesSearch && matchesFilters;
  });

  // 페이지네이션 로직
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredStudents.length / itemsPerPage);
  };

  // 페이지 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, activeTab]);

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      student_name: "",
      gender: "",
      practice_type: "",
      preferred_semester: "",
      preferred_day: "",
      car_available: "",
      practice_manager: "",
      service_payment_status: "",
      created_at_from: "",
      created_at_to: "",
    });
  };

  // 입금완료 처리 (관리대기 탭에서만 사용)
  const handleMarkAsPaid = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from("student_applications")
        .update({
          payment_status: "paid",
          service_payment_status: "입금완료",
        })
        .in("id", selectedStudents);

      if (error) throw error;

      // 로컬 상태 업데이트
      setStudents((prev) =>
        prev.map((student) =>
          selectedStudents.includes(student.id)
            ? {
                ...student,
                payment_status: "paid",
                service_payment_status: "입금완료",
              }
            : student
        )
      );

      setSelectedStudents([]);
      alert(`${selectedStudents.length}명의 학생을 입금완료로 처리했습니다.`);
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("입금완료 처리 중 오류가 발생했습니다.");
    }
  };

  // 입금취소 처리 (관리대기 탭에서만 사용)
  const handleMarkAsUnpaid = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from("student_applications")
        .update({
          payment_status: "pending",
          service_payment_status: null,
        })
        .in("id", selectedStudents);

      if (error) throw error;

      // 로컬 상태 업데이트
      setStudents((prev) =>
        prev.map((student) =>
          selectedStudents.includes(student.id)
            ? {
                ...student,
                payment_status: "pending",
                service_payment_status: null,
              }
            : student
        )
      );

      setSelectedStudents([]);
      alert(`${selectedStudents.length}명의 학생을 입금대기로 되돌렸습니다.`);
    } catch (error) {
      console.error("Error marking as unpaid:", error);
      alert("입금취소 처리 중 오류가 발생했습니다.");
    }
  };

  // 실습완료 처리 (관리대기 탭에서만 사용)
  const handleMarkAsPracticeCompleted = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from("student_applications")
        .update({
          practice_completion_status: "completed",
        })
        .in("id", selectedStudents);

      if (error) throw error;

      // 로컬 상태 업데이트
      setStudents((prev) =>
        prev.map((student) =>
          selectedStudents.includes(student.id)
            ? {
                ...student,
                practice_completion_status: "completed",
              }
            : student
        )
      );

      setSelectedStudents([]);
      alert(`${selectedStudents.length}명의 학생을 실습완료로 처리했습니다.`);
    } catch (error) {
      console.error("Error marking as practice completed:", error);
      alert("실습완료 처리 중 오류가 발생했습니다.");
    }
  };

  // 환불 처리
  const handleMarkAsRefunded = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from("student_applications")
        .update({
          payment_status: "refunded",
          service_payment_status: "환불완료",
        })
        .in("id", selectedStudents);

      if (error) throw error;

      // 로컬 상태 업데이트
      setStudents((prev) =>
        prev.map((student) =>
          selectedStudents.includes(student.id)
            ? {
                ...student,
                payment_status: "refunded",
                service_payment_status: "환불완료",
              }
            : student
        )
      );

      setSelectedStudents([]);
      alert(`${selectedStudents.length}명의 학생을 환불완료로 처리했습니다.`);
    } catch (error) {
      console.error("Error marking as refunded:", error);
      alert("환불처리 중 오류가 발생했습니다.");
    }
  };

  // 상태 변경 (완료 ↔ 환불)
  const handleStatusChange = async (
    studentId: string,
    newStatus: "completed" | "refunded"
  ) => {
    try {
      const { error } = await supabase
        .from("student_applications")
        .update({
          payment_status: newStatus,
          service_payment_status:
            newStatus === "completed" ? "입금완료" : "환불완료",
        })
        .eq("id", studentId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? {
                ...student,
                payment_status: newStatus,
                service_payment_status:
                  newStatus === "completed" ? "입금완료" : "환불완료",
              }
            : student
        )
      );

      alert(
        `상태가 ${
          newStatus === "completed" ? "입금완료" : "환불완료"
        }로 변경되었습니다.`
      );
    } catch (error) {
      console.error("Error changing status:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedStudents.length === 0) return;

    try {
      const { error } = await supabase
        .from("student_applications")
        .delete()
        .in("id", selectedStudents);

      if (error) throw error;

      await fetchStudents();
      setSelectedStudents([]);
      setShowDeleteModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="flex-1 p-6 max-w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
            <p className="text-gray-600">
              전체 학생 정보 및 실습신청을 관리합니다.
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "pending"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  관리대기 (
                  {
                    students.filter(
                      (s) =>
                        s.payment_status !== "refunded" &&
                        s.practice_completion_status !== "completed"
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "completed"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  실습완료 (
                  {
                    students.filter(
                      (s) => s.practice_completion_status === "completed"
                    ).length
                  }
                  )
                </button>
                <button
                  onClick={() => setActiveTab("refunded")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "refunded"
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  환불완료 (
                  {
                    students.filter((s) => s.payment_status === "refunded")
                      .length
                  }
                  )
                </button>
              </nav>
            </div>
          </div>

          {/* 검색 및 필터링 UI */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색창 */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="학생 검색 (이름, 전화번호, 주소, 실습종류 등)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* 필터 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    showFilters
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                    />
                  </svg>
                  필터
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 필터 드롭다운 */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      학생명
                    </label>
                    <input
                      type="text"
                      value={filters.student_name}
                      onChange={(e) =>
                        setFilters({ ...filters, student_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="예: 홍길동"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      성별
                    </label>
                    <select
                      value={filters.gender}
                      onChange={(e) =>
                        setFilters({ ...filters, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체</option>
                      <option value="남">남</option>
                      <option value="여">여</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      실습종류
                    </label>
                    <select
                      value={filters.practice_type}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          practice_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체</option>
                      <option value="사회복지사">사회복지사</option>
                      <option value="보육교사">보육교사</option>
                      <option value="한국어교원">한국어교원</option>
                      <option value="평생교육사">평생교육사</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      희망학기
                    </label>
                    <select
                      value={filters.preferred_semester}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          preferred_semester: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체</option>

                      <option value="26년도 1학기">26년도 1학기</option>
                      <option value="26년도 2학기">26년도 2학기</option>
                      <option value="27년도 1학기">27년도 1학기</option>
                      <option value="27년도 2학기">27년도 2학기</option>
                      <option value="28년도 1학기">28년도 1학기</option>
                      <option value="28년도 2학기">28년도 2학기</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      희망요일
                    </label>
                    <select
                      value={filters.preferred_day}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          preferred_day: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체</option>
                      <option value="평일">평일</option>
                      <option value="주말">주말</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      자차여부
                    </label>
                    <select
                      value={filters.car_available || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          car_available: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체</option>
                      <option value="O">O</option>
                      <option value="X">X</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      실습담당자
                    </label>
                    <input
                      type="text"
                      value={filters.practice_manager}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          practice_manager: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="예: 김담당"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      서비스비용 입금여부
                    </label>
                    <select
                      value={filters.service_payment_status}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          service_payment_status: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체</option>
                      <option value="입금완료">입금완료</option>
                      <option value="입금대기">입금대기</option>
                      <option value="미입금">미입금</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      신청일 (시작)
                    </label>
                    <input
                      type="date"
                      value={filters.created_at_from}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          created_at_from: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      신청일 (종료)
                    </label>
                    <input
                      type="date"
                      value={filters.created_at_to}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          created_at_to: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                총 {filteredStudents.length}명의 학생
              </span>
              {selectedStudents.length > 0 && (
                <span className="text-sm text-blue-600">
                  {selectedStudents.length}개 선택됨
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {selectedStudents.length > 0 && (
                <>
                  {activeTab === "pending" && (
                    <>
                      <button
                        onClick={handleMarkAsPaid}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        입금완료 ({selectedStudents.length})
                      </button>
                      <button
                        onClick={handleMarkAsUnpaid}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                      >
                        입금취소 ({selectedStudents.length})
                      </button>
                      <button
                        onClick={handleMarkAsPracticeCompleted}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        실습완료 ({selectedStudents.length})
                      </button>
                    </>
                  )}
                  {activeTab === "completed" && (
                    <>
                      <button
                        onClick={() => {
                          // 실습완료에서 관리대기로 일괄 이동
                          const updatePromises = selectedStudents.map(
                            (studentId) =>
                              supabase
                                .from("student_applications")
                                .update({
                                  practice_completion_status: "not_started",
                                })
                                .eq("id", studentId)
                          );

                          Promise.all(updatePromises).then(() => {
                            setStudents((prev) =>
                              prev.map((student) =>
                                selectedStudents.includes(student.id)
                                  ? {
                                      ...student,
                                      practice_completion_status: "not_started",
                                    }
                                  : student
                              )
                            );
                            setSelectedStudents([]);
                            alert(
                              `${selectedStudents.length}명의 학생을 관리대기로 이동했습니다.`
                            );
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        관리대기로 ({selectedStudents.length})
                      </button>
                      <button
                        onClick={() => {
                          // 실습완료에서 환불완료로 일괄 이동
                          const updatePromises = selectedStudents.map(
                            (studentId) =>
                              supabase
                                .from("student_applications")
                                .update({
                                  payment_status: "refunded",
                                  service_payment_status: "환불완료",
                                })
                                .eq("id", studentId)
                          );

                          Promise.all(updatePromises).then(() => {
                            setStudents((prev) =>
                              prev.map((student) =>
                                selectedStudents.includes(student.id)
                                  ? {
                                      ...student,
                                      payment_status: "refunded",
                                      service_payment_status: "환불완료",
                                    }
                                  : student
                              )
                            );
                            setSelectedStudents([]);
                            alert(
                              `${selectedStudents.length}명의 학생을 환불완료로 이동했습니다.`
                            );
                          });
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        환불완료로 ({selectedStudents.length})
                      </button>
                    </>
                  )}
                  {activeTab === "refunded" && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                    >
                      선택 삭제 ({selectedStudents.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div
              className="overflow-x-auto max-w-full"
              style={{ maxWidth: "100vw" }}
            >
              <table className="w-full min-w-[2400px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[50px]">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudents.length === filteredStudents.length &&
                          filteredStudents.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      학생명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                      성별
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      연락처
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      생년월일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                      주소
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      희망실습일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      희망학기
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      실습종류
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                      희망요일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                      자차여부
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      에듀바이저
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      현금영수증번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      실습담당자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      실습교육원
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      현장실습기관
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                      서비스비용 입금여부
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                      상담내용
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                      특이사항
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      신청일
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedData().map((student) => (
                    <tr
                      key={student.id}
                      className={`${
                        student.payment_status === "paid" &&
                        activeTab === "pending"
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 min-w-[50px]">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 min-w-[100px]">
                        {student.student_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[80px]">
                        {student.gender}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.phone}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                        {student.birth_date}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 min-w-[200px]">
                        {student.address}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.preferred_practice_date}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.preferred_semester}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                        {student.practice_type}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[80px]">
                        {student.preferred_day}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[80px]">
                        {student.car_available}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.advisor_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.cash_receipt_number || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.practice_manager || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.practice_education_center || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                        {student.practice_institution || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[140px]">
                        {student.service_payment_status || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 min-w-[150px]">
                        {student.consultation_content || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 min-w-[150px]">
                        {student.special_notes || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium min-w-[120px]">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-900 text-xs whitespace-nowrap"
                          >
                            수정
                          </button>
                          {activeTab === "pending" &&
                            student.payment_status === "paid" && (
                              <>
                                <button
                                  onClick={() => {
                                    const studentId = student.id;
                                    supabase
                                      .from("student_applications")
                                      .update({
                                        payment_status: "pending",
                                        service_payment_status: null,
                                      })
                                      .eq("id", studentId)
                                      .then(() => {
                                        setStudents((prev) =>
                                          prev.map((s) =>
                                            s.id === studentId
                                              ? {
                                                  ...s,
                                                  payment_status: "pending",
                                                  service_payment_status: null,
                                                }
                                              : s
                                          )
                                        );
                                        alert("입금대기로 되돌렸습니다.");
                                      });
                                  }}
                                  className="text-orange-600 hover:text-orange-900 text-xs whitespace-nowrap"
                                >
                                  입금취소
                                </button>
                                <button
                                  onClick={() =>
                                    handleMarkAsPracticeCompleted()
                                  }
                                  className="text-green-600 hover:text-green-900 text-xs whitespace-nowrap"
                                >
                                  실습완료
                                </button>
                              </>
                            )}
                          {activeTab === "completed" && (
                            <>
                              <button
                                onClick={() => {
                                  // 실습완료에서 관리대기로 복구
                                  const studentId = student.id;
                                  supabase
                                    .from("student_applications")
                                    .update({
                                      practice_completion_status: "not_started",
                                    })
                                    .eq("id", studentId)
                                    .then(() => {
                                      setStudents((prev) =>
                                        prev.map((s) =>
                                          s.id === studentId
                                            ? {
                                                ...s,
                                                practice_completion_status:
                                                  "not_started",
                                              }
                                            : s
                                        )
                                      );
                                      alert("관리대기로 이동했습니다.");
                                    });
                                }}
                                className="text-blue-600 hover:text-blue-900 text-xs whitespace-nowrap"
                              >
                                관리대기로
                              </button>
                              <button
                                onClick={() => {
                                  // 실습완료에서 환불완료로 이동
                                  const studentId = student.id;
                                  supabase
                                    .from("student_applications")
                                    .update({
                                      payment_status: "refunded",
                                      service_payment_status: "환불완료",
                                    })
                                    .eq("id", studentId)
                                    .then(() => {
                                      setStudents((prev) =>
                                        prev.map((s) =>
                                          s.id === studentId
                                            ? {
                                                ...s,
                                                payment_status: "refunded",
                                                service_payment_status:
                                                  "환불완료",
                                              }
                                            : s
                                        )
                                      );
                                      alert("환불완료로 이동했습니다.");
                                    });
                                }}
                                className="text-red-600 hover:text-red-900 text-xs whitespace-nowrap"
                              >
                                환불완료로
                              </button>
                            </>
                          )}
                          {activeTab === "refunded" && (
                            <button
                              onClick={() => {
                                // 환불에서 관리대기로 복구
                                const studentId = student.id;
                                supabase
                                  .from("student_applications")
                                  .update({
                                    payment_status: "pending",
                                    service_payment_status: null,
                                  })
                                  .eq("id", studentId)
                                  .then(() => {
                                    setStudents((prev) =>
                                      prev.map((s) =>
                                        s.id === studentId
                                          ? {
                                              ...s,
                                              payment_status: "pending",
                                              service_payment_status: null,
                                            }
                                          : s
                                      )
                                    );
                                    alert("관리대기로 복구되었습니다.");
                                  });
                              }}
                              className="text-blue-600 hover:text-blue-900 text-xs whitespace-nowrap"
                            >
                              관리대기로
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          {getTotalPages() > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 {filteredStudents.length}명 중{" "}
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)}
                명 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "text-white bg-blue-600 border border-blue-600"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, getTotalPages())
                    )
                  }
                  disabled={currentPage === getTotalPages()}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 편집 모달 */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  학생 정보 수정 - {editingStudent.student_name}
                </h3>
                <button
                  onClick={handleCancel}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {/* 기본 정보 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    학생명
                  </label>
                  <input
                    type="text"
                    value={editForm.student_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, student_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    성별
                  </label>
                  <select
                    value={editForm.gender || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처
                  </label>
                  <input
                    type="text"
                    value={editForm.phone || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    생년월일
                  </label>
                  <input
                    type="text"
                    value={editForm.birth_date || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, birth_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={editForm.address || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    희망실습일
                  </label>
                  <input
                    type="text"
                    value={editForm.preferred_practice_date || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        preferred_practice_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    성적보고일
                  </label>
                  <input
                    type="text"
                    value={editForm.grade_report_date || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        grade_report_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    희망학기
                  </label>
                  <select
                    value={editForm.preferred_semester || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        preferred_semester: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="26년도 1학기">26년도 1학기</option>
                    <option value="26년도 2학기">26년도 2학기</option>
                    <option value="27년도 1학기">27년도 1학기</option>
                    <option value="27년도 2학기">27년도 2학기</option>
                    <option value="28년도 1학기">28년도 1학기</option>
                    <option value="28년도 2학기">28년도 2학기</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실습종류
                  </label>
                  <select
                    value={editForm.practice_type || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        practice_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="사회복지사">사회복지사</option>
                    <option value="보육교사">보육교사</option>
                    <option value="한국어교원">한국어교원</option>
                    <option value="평생교육사">평생교육사</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    희망요일
                  </label>
                  <select
                    value={editForm.preferred_day || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        preferred_day: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="평일">평일</option>
                    <option value="주말">주말</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    에듀바이저스 이름
                  </label>
                  <input
                    type="text"
                    value={editForm.advisor_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, advisor_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    자차여부
                  </label>
                  <select
                    value={editForm.car_available || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        car_available: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="O">O</option>
                    <option value="X">X</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현금영수증 번호
                  </label>
                  <input
                    type="text"
                    value={editForm.cash_receipt_number || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cash_receipt_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 관리자 수정 필드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실습담당자
                  </label>
                  <input
                    type="text"
                    value={editForm.practice_manager || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        practice_manager: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="실습담당자"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실습인정기간
                  </label>
                  <input
                    type="text"
                    value={editForm.practice_period || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        practice_period: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="실습인정기간"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    실습교육원
                  </label>
                  <input
                    type="text"
                    value={editForm.practice_education_center || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        practice_education_center: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="실습교육원"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현장실습기관
                  </label>
                  <input
                    type="text"
                    value={editForm.practice_institution || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        practice_institution: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="현장실습기관"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    서비스비용 입금여부
                  </label>
                  <select
                    value={editForm.service_payment_status || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        service_payment_status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="입금완료">입금완료</option>
                    <option value="입금대기">입금대기</option>
                    <option value="입금미완료">입금미완료</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상담내용
                  </label>
                  <textarea
                    value={editForm.consultation_content || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        consultation_content: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="상담내용"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    특이사항
                  </label>
                  <textarea
                    value={editForm.special_notes || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        special_notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="특이사항"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                삭제 확인
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  선택된 {selectedStudents.length}개의 학생 정보를
                  삭제하시겠습니까?
                  <br />이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
