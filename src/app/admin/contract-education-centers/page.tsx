"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { AdminAuth } from "@/lib/admin-auth";
import { AdminLogger } from "@/lib/admin-logger";

interface ContractEducationCenter {
  id: string;
  classification: string;
  student_name: string;
  contact: string;
  payment_amount: string;
  payment_date: string;
  payment_method: string;
  manager: string;
  special_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function ContractEducationCentersPage() {
  const [centers, setCenters] = useState<ContractEducationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canDelete, setCanDelete] = useState(false);
  const [editingCenter, setEditingCenter] =
    useState<ContractEducationCenter | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContractEducationCenter>>(
    {}
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 필터링 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    classification: "",
    student_name: "",
    contact: "",
    payment_amount: "",
    payment_date: "",
    payment_method: "",
    manager: "",
    special_notes: "",
  });
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchCenters();
    checkDeletePermission();
  }, []);

  const checkDeletePermission = async () => {
    const hasDeletePermission = await AdminAuth.canDelete();
    setCanDelete(hasDeletePermission);
  };

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contract_education_centers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCenters(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "협약교육원 데이터를 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (center: ContractEducationCenter) => {
    setEditingCenter(center);
    setEditForm(center);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    setEditingCenter(null);
    setEditForm({
      classification: "",
      student_name: "",
      contact: "",
      payment_amount: "",
      payment_date: "",
      payment_method: "",
      manager: "",
      special_notes: "",
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      let recordId: string;
      let actionType: string;
      let oldValues: any = null;

      if (editingCenter) {
        // 수정
        oldValues = editingCenter;
        const { error } = await supabase
          .from("contract_education_centers")
          .update(editForm)
          .eq("id", editingCenter.id);

        if (error) throw error;
        recordId = editingCenter.id;
        actionType = "UPDATE";
      } else {
        // 추가
        const { data, error } = await supabase
          .from("contract_education_centers")
          .insert([editForm]);

        if (error) throw error;
        recordId = data?.[0]?.id || "unknown";
        actionType = "CREATE";
      }

      // 로그 기록
      const currentUser = await AdminAuth.getCurrentUser();
      if (currentUser) {
        try {
          await AdminLogger.logActivity(
            currentUser.id,
            currentUser.name || "알 수 없음",
            currentUser.position_name || "알 수 없음",
            actionType,
            "contract_education_centers",
            recordId,
            oldValues,
            editForm,
            `협약교육원 ${actionType === "CREATE" ? "등록" : "수정"}: ${
              editForm.student_name
            }`,
            undefined,
            navigator.userAgent
          );
        } catch (logError) {
          console.error("협약교육원 저장 - 로그 기록 실패:", logError);
        }
      }

      // 데이터 새로고침
      await fetchCenters();
      setEditingCenter(null);
      setEditForm({});
      setShowEditModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    }
  };

  const handleCancel = () => {
    setEditingCenter(null);
    setEditForm({});
    setShowEditModal(false);
  };

  const handleSelectCenter = (centerId: string) => {
    setSelectedCenters((prev) =>
      prev.includes(centerId)
        ? prev.filter((id) => id !== centerId)
        : [...prev, centerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCenters.length === filteredCenters.length) {
      setSelectedCenters([]);
    } else {
      setSelectedCenters(filteredCenters.map((c) => c.id));
    }
  };

  // 필터링된 데이터
  const filteredCenters = centers.filter((center) => {
    const matchesSearch =
      !searchTerm ||
      (center.classification &&
        center.classification
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (center.student_name &&
        center.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (center.contact &&
        center.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (center.payment_amount &&
        center.payment_amount
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (center.payment_date &&
        center.payment_date.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (center.payment_method &&
        center.payment_method
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (center.manager &&
        center.manager.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (center.special_notes &&
        center.special_notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      const centerValue = center[key as keyof ContractEducationCenter];
      return (
        centerValue?.toString().toLowerCase().includes(value.toLowerCase()) ??
        false
      );
    });

    // 월별 필터링 (날짜 형식을 월 형식으로 변환하여 비교)
    const matchesMonthFilter =
      selectedMonths.length === 0 ||
      selectedMonths.some((selectedMonth) => {
        // selectedMonth 형식: "25년07월"
        // center.payment_date 형식: "2025-07-01"
        if (!center.payment_date) return false;

        // 날짜를 월 형식으로 변환
        const date = new Date(center.payment_date);
        const year = date.getFullYear().toString().slice(-2);
        const monthNum = (date.getMonth() + 1).toString().padStart(2, "0");
        const dateMonth = `${year}년${monthNum}월`;

        return dateMonth === selectedMonth;
      });

    return matchesSearch && matchesFilters && matchesMonthFilter;
  });

  // 페이지네이션 로직
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCenters.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredCenters.length / itemsPerPage);
  };

  // 페이지 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      classification: "",
      student_name: "",
      contact: "",
      payment_amount: "",
      payment_date: "",
      payment_method: "",
      manager: "",
      special_notes: "",
    });
    setSelectedMonths([]);
  };

  // 월별 체크박스 핸들러
  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  // 결제 방법 업데이트 핸들러
  const handlePaymentMethodUpdate = async (
    centerId: string,
    newPaymentMethod: string
  ) => {
    try {
      const { error } = await supabase
        .from("contract_education_centers")
        .update({ payment_method: newPaymentMethod })
        .eq("id", centerId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setCenters((prev) =>
        prev.map((center) =>
          center.id === centerId
            ? { ...center, payment_method: newPaymentMethod }
            : center
        )
      );

      alert(`결제 방법이 "${newPaymentMethod}"로 변경되었습니다.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "결제 방법 변경에 실패했습니다."
      );
    }
  };

  // 일괄 결제 방법 업데이트 핸들러
  const handleBulkPaymentMethodUpdate = async (newPaymentMethod: string) => {
    if (selectedCenters.length === 0) return;

    try {
      const { error } = await supabase
        .from("contract_education_centers")
        .update({ payment_method: newPaymentMethod })
        .in("id", selectedCenters);

      if (error) throw error;

      // 로그 기록
      const currentUser = await AdminAuth.getCurrentUser();
      if (currentUser) {
        try {
          for (const centerId of selectedCenters) {
            const center = centers.find((c) => c.id === centerId);
            await AdminLogger.logActivity(
              currentUser.id,
              currentUser.name || "알 수 없음",
              currentUser.position_name || "알 수 없음",
              "UPDATE",
              "contract_education_centers",
              centerId,
              center,
              { payment_method: newPaymentMethod },
              `협약교육원 결제방법 변경: ${
                center?.student_name || centerId
              } → ${newPaymentMethod}`,
              undefined,
              navigator.userAgent
            );
          }
        } catch (logError) {
          console.error("결제방법 변경 - 로그 기록 실패:", logError);
        }
      }

      // 로컬 상태 업데이트
      setCenters((prev) =>
        prev.map((center) =>
          selectedCenters.includes(center.id)
            ? { ...center, payment_method: newPaymentMethod }
            : center
        )
      );

      setSelectedCenters([]);
      alert(
        `${selectedCenters.length}개의 협약교육원이 "${newPaymentMethod}"로 변경되었습니다.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "일괄 결제 방법 변경에 실패했습니다."
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCenters.length === 0) return;

    const deleteCount = selectedCenters.length;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("contract_education_centers")
        .delete()
        .in("id", selectedCenters);

      if (error) throw error;

      // 로컬 상태에서 즉시 제거
      setCenters((prev) =>
        prev.filter((center) => !selectedCenters.includes(center.id))
      );
      setSelectedCenters([]);
      setShowDeleteModal(false);
      setError(null);

      // 활동 로그 기록
      const currentUser = await AdminAuth.getCurrentUser();
      if (currentUser) {
        for (const centerId of selectedCenters) {
          await AdminLogger.logActivity(
            currentUser.id,
            currentUser.name,
            currentUser.position_name,
            "DELETE",
            "contract_education_centers",
            centerId,
            {},
            null,
            `협약교육원 삭제: ID ${centerId}`,
            undefined,
            navigator.userAgent
          );
        }
      }

      alert(`${deleteCount}개의 협약교육원 정보가 삭제되었습니다.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      await fetchCenters();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  // 날짜를 년월일 형식으로 포맷팅
  const formatDateToKorean = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}년${month}월${day}일`;
  };

  // 결제 방법별 색상 반환
  const getPaymentMethodColor = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "카드결제":
        return "bg-green-100 text-green-800"; // 연한 초록색
      case "계좌이체":
        return "bg-green-100 text-green-800"; // 연한 초록색
      case "확인불가":
        return "bg-green-100 text-green-800"; // 연한 초록색
      case "코드누락":
        return "bg-yellow-100 text-yellow-800"; // 노란색
      case "환불자":
        return "bg-red-100 text-red-800"; // 빨간색
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 행별 배경색 반환
  const getRowBackgroundColor = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "카드결제":
      case "계좌이체":
      case "확인불가":
        return "bg-green-50"; // 연한 초록색
      case "코드누락":
        return "bg-yellow-50"; // 노란색
      case "환불자":
        return "bg-red-50"; // 빨간색
      default:
        return "bg-white";
    }
  };

  // 결제일 옵션 생성 (24년11월~26년12월)
  const generatePaymentDateOptions = () => {
    const options = [];
    const startYear = 2024;
    const endYear = 2026;

    for (let year = startYear; year <= endYear; year++) {
      const startMonth = year === startYear ? 11 : 1;
      const endMonth = year === endYear ? 12 : 12;

      for (let month = startMonth; month <= endMonth; month++) {
        const yearStr = year.toString().slice(-2);
        const monthStr = month.toString().padStart(2, "0");
        options.push(`${yearStr}년${monthStr}월`);
      }
    }

    return options;
  };

  // 년월일 옵션 생성 (24년11월01일~26년12월31일)
  const generateFullDateOptions = () => {
    const options = [];
    const startYear = 2024;
    const endYear = 2026;

    for (let year = startYear; year <= endYear; year++) {
      const startMonth = year === startYear ? 11 : 1;
      const endMonth = year === endYear ? 12 : 12;

      for (let month = startMonth; month <= endMonth; month++) {
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const yearStr = year.toString().slice(-2);
          const monthStr = month.toString().padStart(2, "0");
          const dayStr = day.toString().padStart(2, "0");
          options.push(`${yearStr}년${monthStr}월${dayStr}일`);
        }
      }
    }

    return options;
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
            <h1 className="text-2xl font-bold text-gray-900">
              협약교육원 관리
            </h1>
            <p className="text-gray-600">협약교육원 정보를 관리합니다.</p>
          </div>

          {/* 검색 및 필터링 UI */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색창 */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="협약교육원 검색 (분류, 학생명, 연락처, 담당자 등)..."
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
                      분류
                    </label>
                    <input
                      type="text"
                      value={filters.classification}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          classification: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="예: 사회복지사"
                    />
                  </div>

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
                      연락처
                    </label>
                    <input
                      type="text"
                      value={filters.contact}
                      onChange={(e) =>
                        setFilters({ ...filters, contact: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="예: 010-1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      결제금액
                    </label>
                    <input
                      type="text"
                      value={filters.payment_amount}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          payment_amount: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="예: 500,000원"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      결제일 (월별 선택)
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {generatePaymentDateOptions().map((date) => (
                        <label key={date} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={selectedMonths.includes(date)}
                            onChange={() => handleMonthToggle(date)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                          />
                          <span className="text-xs">{date}</span>
                        </label>
                      ))}
                    </div>
                    {selectedMonths.length > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        선택된 월: {selectedMonths.join(", ")}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      결제방법
                    </label>
                    <select
                      value={filters.payment_method}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">전체</option>
                      <option value="카드결제">카드결제</option>
                      <option value="계좌이체">계좌이체</option>
                      <option value="확인불가">확인불가</option>
                      <option value="코드누락">코드누락</option>
                      <option value="환불자">환불자</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      담당자
                    </label>
                    <input
                      type="text"
                      value={filters.manager}
                      onChange={(e) =>
                        setFilters({ ...filters, manager: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="예: 김담당"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      특이사항
                    </label>
                    <input
                      type="text"
                      value={filters.special_notes}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          special_notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="예: 특별할인"
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
                총 {filteredCenters.length}개의 협약교육원
              </span>
              {selectedCenters.length > 0 && (
                <span className="text-sm text-blue-600">
                  {selectedCenters.length}개 선택됨
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg transition-colors text-sm bg-blue-600 text-white hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={() => handleBulkPaymentMethodUpdate("코드누락")}
                className="px-4 py-2 rounded-lg transition-colors text-sm bg-yellow-600 text-white hover:bg-yellow-700"
                disabled={selectedCenters.length === 0}
              >
                코드누락 ({selectedCenters.length})
              </button>
              <button
                onClick={() => handleBulkPaymentMethodUpdate("환불자")}
                className="px-4 py-2 rounded-lg transition-colors text-sm bg-red-600 text-white hover:bg-red-700"
                disabled={selectedCenters.length === 0}
              >
                환불자 ({selectedCenters.length})
              </button>
              {selectedCenters.length > 0 && canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-lg transition-colors text-sm bg-gray-600 text-white hover:bg-gray-700"
                >
                  선택 삭제
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div
              className="overflow-x-auto max-w-full"
              style={{ maxWidth: "100vw" }}
            >
              <table className="w-full min-w-[1800px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[50px]">
                      <input
                        type="checkbox"
                        checked={
                          selectedCenters.length === filteredCenters.length &&
                          filteredCenters.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                      관리
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      분류
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      학생명
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      연락처
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                      결제금액
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      결제일
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      결제방법
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                      담당자
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                      특이사항
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedData().map((center) => (
                    <tr
                      key={center.id}
                      className={getRowBackgroundColor(center.payment_method)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 min-w-[50px] text-center">
                        <input
                          type="checkbox"
                          checked={selectedCenters.includes(center.id)}
                          onChange={() => handleSelectCenter(center.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium min-w-[80px] text-center">
                        <button
                          onClick={() => handleEdit(center)}
                          className="text-blue-600 hover:text-blue-900 text-xs whitespace-nowrap"
                        >
                          수정
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px] text-center">
                        {center.classification}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px] text-center">
                        {center.student_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px] text-center">
                        {center.contact}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px] text-center">
                        {center.payment_amount}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px] text-center">
                        {formatDateToKorean(center.payment_date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm min-w-[100px] text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(
                            center.payment_method
                          )}`}
                        >
                          {center.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px] text-center">
                        {center.manager}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 min-w-[150px] text-center">
                        {center.special_notes || "-"}
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
                총 {filteredCenters.length}개 중{" "}
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredCenters.length)}개
                표시
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
      {showEditModal && (
        <div className="fixed inset-0 bg-[#00000080] overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCenter ? "협약교육원 정보 수정" : "협약교육원 추가"}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    분류 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.classification || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        classification: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 사회복지사"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    학생명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.student_name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, student_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.contact || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contact: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 010-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제금액 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.payment_amount || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        payment_amount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 500,000원"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.payment_date || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, payment_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2024-11-01"
                    max="2026-12-31"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제방법 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.payment_method || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="카드결제">카드결제</option>
                    <option value="계좌이체">계좌이체</option>
                    <option value="확인불가">확인불가</option>
                    <option value="코드누락">코드누락</option>
                    <option value="환불자">환불자</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.manager || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, manager: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김담당"
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
                    placeholder="특이사항을 입력해주세요..."
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
        <div className="fixed inset-0 bg-[#00000080] overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-100 flex justify-center items-center shadow-lg rounded-md bg-white">
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
                  선택된 {selectedCenters.length}개의 협약교육원 정보를
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
