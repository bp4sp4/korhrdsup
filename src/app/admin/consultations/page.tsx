"use client";

import { useState, useEffect } from "react";
import {
  Consultation,
  CreateConsultationData,
  CONSULTATION_TYPES,
  Consultant,
} from "@/types/consultation";
import { ConsultationService } from "@/lib/consultation-service";

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingConsultation, setEditingConsultation] =
    useState<Consultation | null>(null);
  const [stats, setStats] = useState({ total: 0 });
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [filters, setFilters] = useState({
    consultantName: "",
    consultationType: "",
    contentSearch: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;
  const [selectedConsultations, setSelectedConsultations] = useState<
    Set<string>
  >(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [newConsultation, setNewConsultation] =
    useState<CreateConsultationData>({
      consultation_type: "기술지원",
      consultant_name: "",
      consultation_content: "",
      member_name: "",
    });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // 상담 목록 로드
  const loadConsultations = async () => {
    setIsLoading(true);
    try {
      const [consultationsData, statsData, consultantsData] = await Promise.all(
        [
          ConsultationService.getConsultations(filters),
          ConsultationService.getConsultationStats(filters),
          ConsultationService.getConsultants(),
        ]
      );
      setConsultations(consultationsData);
      setStats(statsData);
      setConsultants(consultantsData);

      // 페이지네이션 계산
      const totalPages = Math.ceil(consultationsData.length / itemsPerPage);
      setTotalPages(totalPages);

      // 현재 페이지가 총 페이지 수를 초과하면 첫 페이지로 이동
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("상담 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    loadConsultations();
  }, [filters]);

  // 새 상담 추가
  const handleAddConsultation = async () => {
    if (
      !newConsultation.consultant_name.trim() ||
      !newConsultation.consultation_content.trim()
    ) {
      alert("상담자명과 상담내용은 필수입니다.");
      return;
    }

    try {
      let fileData = {};
      if (attachedFile) {
        const uploadResult = await ConsultationService.uploadFile(attachedFile);
        fileData = {
          attached_file_name: uploadResult.name,
          attached_file_url: uploadResult.url,
          attached_file_size: uploadResult.size,
        };
      }

      await ConsultationService.createConsultation({
        ...newConsultation,
        consultation_content: formatContentForSave(
          newConsultation.consultation_content
        ),
        ...fileData,
      });

      setNewConsultation({
        consultation_type: "기술지원",
        consultant_name: "",
        consultation_content: "",
        member_name: "",
      });
      setAttachedFile(null);
      setShowAddForm(false);
      loadConsultations();
    } catch (error) {
      console.error("상담 추가 실패:", error);
    }
  };

  // 상담 수정
  const handleEditConsultation = async () => {
    if (!editingConsultation) return;

    try {
      let fileData = {};
      if (attachedFile) {
        // 기존 파일 삭제
        if (editingConsultation.attached_file_url) {
          await ConsultationService.deleteFile(
            editingConsultation.attached_file_url
          );
        }
        // 새 파일 업로드
        const uploadResult = await ConsultationService.uploadFile(attachedFile);
        fileData = {
          attached_file_name: uploadResult.name,
          attached_file_url: uploadResult.url,
          attached_file_size: uploadResult.size,
        };
      }

      await ConsultationService.updateConsultation(editingConsultation.id, {
        ...editingConsultation,
        consultation_content: formatContentForSave(
          editingConsultation.consultation_content
        ),
        ...fileData,
      });

      setEditingConsultation(null);
      setAttachedFile(null);
      loadConsultations();
    } catch (error) {
      console.error("상담 수정 실패:", error);
    }
  };

  // 상담 삭제
  const handleDeleteConsultation = async (id: string) => {
    if (!confirm("상담을 삭제하시겠습니까?")) return;

    try {
      console.log("삭제 시작 - ID:", id);
      await ConsultationService.deleteConsultation(id);
      console.log("삭제 완료 - ID:", id);

      if (selectedConsultation?.id === id) {
        setSelectedConsultation(null);
      }
      loadConsultations();
      alert("상담이 삭제되었습니다.");
    } catch (error) {
      console.error("상담 삭제 실패:", error);
      alert("상담 삭제에 실패했습니다: " + (error as Error).message);
    }
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 상담 번호 생성 (날짜 + 순번)
  const generateConsultationNumber = (
    consultation: Consultation,
    index: number
  ) => {
    const date = new Date(consultation.consultation_date);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    // 전체 상담 수에서 현재 인덱스를 빼서 역순으로 번호 생성
    const sequence = (consultations.length - index).toString().padStart(3, "0");
    return `${year}${month}${day}-${sequence}`;
  };

  // 상담내용을 HTML로 변환 (li 태그가 있으면 그대로, 없으면 엔터로 분리)
  const formatConsultationContent = (content: string) => {
    // 이미 li 태그가 포함되어 있는 경우
    if (content.includes("<li>")) {
      // 중첩된 li 태그 정리
      const cleanContent = content
        .replace(/<li><li>/g, "<li>")
        .replace(/<\/li><\/li>/g, "</li>")
        .replace(/<li><li><li>/g, "<li>")
        .replace(/<\/li><\/li><\/li>/g, "</li>");

      return cleanContent
        .split("<li>")
        .filter((line) => line.trim() !== "")
        .map((line, index) => {
          const cleanLine = line.replace("</li>", "").trim();
          if (cleanLine) {
            return (
              <li key={index} className="mb-1">
                {cleanLine.startsWith(">") ? (
                  <span className="text-gray-600 italic">{cleanLine}</span>
                ) : (
                  cleanLine
                )}
              </li>
            );
          }
          return null;
        })
        .filter(Boolean);
    }

    // li 태그가 없는 경우 엔터로 분리
    return content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line, index) => (
        <li key={index} className="mb-1">
          {line.startsWith(">") ? (
            <span className="text-gray-600 italic">{line}</span>
          ) : (
            line
          )}
        </li>
      ));
  };

  // 상담내용을 저장용으로 포맷팅 (엔터를 <li> 태그로 변환)
  const formatContentForSave = (content: string) => {
    // 이미 li 태그가 있는 경우 원본 텍스트만 추출
    if (content.includes("<li>")) {
      return content
        .replace(/<li>/g, "")
        .replace(/<\/li>/g, "\n")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => `<li>${line.trim()}</li>`)
        .join("");
    }

    // 일반 텍스트인 경우
    return content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => `<li>${line.trim()}</li>`)
      .join("");
  };

  // 상담내용을 편집용으로 변환 (HTML 태그 제거하고 순수 텍스트로)
  const formatContentForEdit = (content: string) => {
    if (content.includes("<li>")) {
      return content
        .replace(/<li>/g, "")
        .replace(/<\/li>/g, "\n")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n");
    }
    return content;
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      consultantName: "",
      consultationType: "",
      contentSearch: "",
      startDate: "",
      endDate: "",
    });
  };

  // 필터 업데이트
  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 현재 페이지의 상담 목록 계산
  const getCurrentPageConsultations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return consultations.slice(startIndex, endIndex);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 체크박스 선택/해제
  const handleSelectConsultation = (consultationId: string) => {
    setSelectedConsultations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(consultationId)) {
        newSet.delete(consultationId);
      } else {
        newSet.add(consultationId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    const currentPageConsultations = getCurrentPageConsultations();
    const allSelected = currentPageConsultations.every((consultation) =>
      selectedConsultations.has(consultation.id)
    );

    if (allSelected) {
      // 현재 페이지의 모든 선택 해제
      setSelectedConsultations((prev) => {
        const newSet = new Set(prev);
        currentPageConsultations.forEach((consultation) => {
          newSet.delete(consultation.id);
        });
        return newSet;
      });
    } else {
      // 현재 페이지의 모든 항목 선택
      setSelectedConsultations((prev) => {
        const newSet = new Set(prev);
        currentPageConsultations.forEach((consultation) => {
          newSet.add(consultation.id);
        });
        return newSet;
      });
    }
  };

  // 선택된 상담들 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedConsultations.size === 0) {
      alert("삭제할 상담을 선택해주세요.");
      return;
    }

    if (
      !confirm(
        `선택된 ${selectedConsultations.size}개의 상담을 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      console.log(
        "일괄 삭제 시작 - 선택된 ID들:",
        Array.from(selectedConsultations)
      );

      const deletePromises = Array.from(selectedConsultations).map((id) =>
        ConsultationService.deleteConsultation(id)
      );
      await Promise.all(deletePromises);

      console.log("일괄 삭제 완료");
      setSelectedConsultations(new Set());
      setShowBulkActions(false);
      loadConsultations();
      alert(`${selectedConsultations.size}개의 상담이 삭제되었습니다.`);
    } catch (error) {
      console.error("일괄 삭제 실패:", error);
      alert("일괄 삭제 중 오류가 발생했습니다: " + (error as Error).message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 상담 목록 */}
      <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">상담 관리</h1>
            <div className="flex items-center space-x-2">
              {selectedConsultations.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedConsultations.size}개 선택됨
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    선택 삭제
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                상담 등록
              </button>
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
                    placeholder="상담 검색 (상담자, 상담내용, 회원명 등)..."
                    value={filters.contentSearch}
                    onChange={(e) =>
                      updateFilter("contentSearch", e.target.value)
                    }
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
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isFilterExpanded
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
            {isFilterExpanded && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 상담종류 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상담종류
                    </label>
                    <select
                      value={filters.consultationType}
                      onChange={(e) =>
                        updateFilter("consultationType", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">전체 종류</option>
                      {CONSULTATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 시작일 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        updateFilter("startDate", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 종료일 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료일
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => updateFilter("endDate", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 상담 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">로딩 중...</div>
          ) : consultations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">상담이 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* 전체 선택 체크박스 */}
              {getCurrentPageConsultations().length > 0 && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={getCurrentPageConsultations().every(
                        (consultation) =>
                          selectedConsultations.has(consultation.id)
                      )}
                      onChange={handleSelectAll}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      전체 선택 ({getCurrentPageConsultations().length}개)
                    </span>
                  </div>
                </div>
              )}

              {getCurrentPageConsultations().map((consultation) => (
                <div
                  key={consultation.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    selectedConsultation?.id === consultation.id
                      ? "bg-blue-50 border-r-2 border-blue-500"
                      : ""
                  } ${
                    selectedConsultations.has(consultation.id)
                      ? "bg-yellow-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={selectedConsultations.has(consultation.id)}
                        onChange={() =>
                          handleSelectConsultation(consultation.id)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedConsultation(consultation)}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {generateConsultationNumber(
                              consultation,
                              consultations.indexOf(consultation)
                            )}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {consultation.consultation_type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {consultation.consultant_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(
                            consultation.consultation_date
                          ).toLocaleString("ko-KR")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConsultation(consultation);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500"
                        title="수정"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {consultations.length > 0 && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, consultations.length)} /{" "}
                {consultations.length}개
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 우측 상담 상세 */}
      <div className="w-1/2 bg-white">
        {selectedConsultation ? (
          <div className="h-full flex flex-col">
            {/* 상세 헤더 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  상담 상세
                </h2>
                <div className="text-sm text-gray-500">
                  전체 상담 건수: {stats.total}건
                </div>
              </div>
            </div>

            {/* 상세 내용 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* 상담 정보 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      * 상담자
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedConsultation.consultant_name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      * 상담일자
                    </label>
                    <div className="text-sm text-gray-900">
                      {new Date(
                        selectedConsultation.consultation_date
                      ).toLocaleString("ko-KR")}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      * 회원정보
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedConsultation.member_name || "-"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      * 상담내용
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      <ul className="list-disc list-inside space-y-1">
                        {formatConsultationContent(
                          selectedConsultation.consultation_content
                        )}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      * 첨부파일
                    </label>
                    {selectedConsultation.attached_file_name ? (
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <a
                          href={selectedConsultation.attached_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedConsultation.attached_file_name}
                        </a>
                        <span className="text-xs text-gray-500">
                          (
                          {formatFileSize(
                            selectedConsultation.attached_file_size || 0
                          )}
                          )
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">첨부파일 없음</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            상담을 선택하세요
          </div>
        )}
      </div>

      {/* 새 상담 추가 모달 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">새 상담 등록</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담종류 *
                </label>
                <select
                  value={newConsultation.consultation_type}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      consultation_type: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONSULTATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담자 *
                </label>
                <input
                  type="text"
                  value={newConsultation.consultant_name}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      consultant_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회원명
                </label>
                <input
                  type="text"
                  value={newConsultation.member_name}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      member_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담내용 *
                </label>
                <textarea
                  value={newConsultation.consultation_content}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      consultation_content: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="상담 내용을 입력하세요..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  첨부파일
                </label>
                <input
                  type="file"
                  onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {attachedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    선택된 파일: {attachedFile.name} (
                    {formatFileSize(attachedFile.size)})
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleAddConsultation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상담 수정 모달 */}
      {editingConsultation && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">상담 수정</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담종류 *
                </label>
                <select
                  value={editingConsultation.consultation_type}
                  onChange={(e) =>
                    setEditingConsultation({
                      ...editingConsultation,
                      consultation_type: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONSULTATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담자 *
                </label>
                <input
                  type="text"
                  value={editingConsultation.consultant_name}
                  onChange={(e) =>
                    setEditingConsultation({
                      ...editingConsultation,
                      consultant_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회원명
                </label>
                <input
                  type="text"
                  value={editingConsultation.member_name || ""}
                  onChange={(e) =>
                    setEditingConsultation({
                      ...editingConsultation,
                      member_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담내용 *
                </label>
                <textarea
                  value={formatContentForEdit(
                    editingConsultation.consultation_content
                  )}
                  onChange={(e) =>
                    setEditingConsultation({
                      ...editingConsultation,
                      consultation_content: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  첨부파일
                </label>
                {editingConsultation.attached_file_name && (
                  <div className="mb-2 text-sm text-gray-600">
                    현재 파일: {editingConsultation.attached_file_name} (
                    {formatFileSize(
                      editingConsultation.attached_file_size || 0
                    )}
                    )
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {attachedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    새 파일: {attachedFile.name} (
                    {formatFileSize(attachedFile.size)})
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingConsultation(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleEditConsultation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
