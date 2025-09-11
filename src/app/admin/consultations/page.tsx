"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLogger } from "@/lib/admin-logger";
import { AdminAuth } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase-client";

// Assume these are defined elsewhere and imported
const MEMO_TYPES = ["일반메모", "중요메모", "기타"]; // Example types
const ITEMS_PER_PAGE = 10; // Example items per page

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("consultations");
  const [consultations, setMemos] = useState([]);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [selectedMemos, setSelectedMemos] = useState(new Set());
  const [filters, setFilters] = useState({
    contentSearch: "",
    memoType: "",
    startDate: "",
    endDate: "",
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemo, setNewMemo] = useState({
    memo_type: "",
    writer_name: "",
    related_person: "",
    memo_content: "",
  });
  const [attachedFile, setAttachedFile] = useState(null);
  const [editingMemo, setEditingMemo] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(true); // Placeholder
  const [canDelete, setCanDelete] = useState(true); // Placeholder
  const [stats, setStats] = useState({ total: 0 }); // Placeholder for total consultations
  const [processingStatus, setProcessingStatus] = useState({}); // 메모별 처리 상태 관리

  // --- Mock Data and Functions (Replace with actual API calls) ---

  const fetchMemos = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false });

      // 필터 적용
      if (filters.contentSearch) {
        query = query.or(
          `memo_content.ilike.%${filters.contentSearch}%,related_person.ilike.%${filters.contentSearch}%,writer_name.ilike.%${filters.contentSearch}%`
        );
      }
      if (filters.memoType) {
        query = query.eq("memo_type", filters.memoType);
      }
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMemos(data || []);
      setStats({ total: data?.length || 0 });
    } catch (error) {
      console.error("메모 데이터 조회 실패:", error);
      setMemos([]);
      setStats({ total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const handleAddMemo = async () => {
    try {
      // 필수 필드 검증
      if (
        !newMemo.memo_type ||
        !newMemo.writer_name ||
        !newMemo.related_person ||
        !newMemo.memo_content
      ) {
        alert("모든 필수 필드를 입력해주세요.");
        return;
      }

      // 현재 사용자 정보 가져오기
      const currentUser = await AdminAuth.getCurrentUser();
      if (!currentUser) {
        alert("사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      // Supabase에 메모 데이터 저장
      const { data, error } = await supabase
        .from("consultations")
        .insert([
          {
            memo_type: newMemo.memo_type,
            writer_name: newMemo.writer_name,
            related_person: newMemo.related_person,
            memo_content: newMemo.memo_content,
            memo_date: new Date().toISOString(),
            attached_file_name: attachedFile ? attachedFile.name : null,
            attached_file_url: attachedFile
              ? URL.createObjectURL(attachedFile)
              : null,
            attached_file_size: attachedFile ? attachedFile.size : null,
            user_id: currentUser.id, // RLS 정책을 위해 user_id 추가
            is_processed: false, // 명시적으로 처리완료 상태를 false로 설정
            processed_at: null, // 처리완료 시간을 null로 설정
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // 등록된 데이터 확인
      console.log("메모 등록 성공 - 등록된 데이터:", data);
      console.log("메모 등록 - is_processed 값:", data.is_processed);

      // 로그 기록
      console.log("메모 등록 - 로그 기록 시작");
      console.log("메모 등록 - currentUser:", currentUser);

      if (currentUser) {
        try {
          await AdminLogger.logActivity(
            currentUser.id,
            currentUser.name || "알 수 없음",
            currentUser.position_name || "알 수 없음",
            "CREATE",
            "consultations",
            data.id,
            null,
            newMemo,
            `메모 등록: ${newMemo.related_person}`,
            undefined,
            navigator.userAgent
          );
          console.log("메모 등록 - 로그 기록 완료");
        } catch (logError) {
          console.error("메모 등록 - 로그 기록 실패:", logError);
        }
      } else {
        console.log("메모 등록 - currentUser가 null입니다");
      }

      setNewMemo({
        memo_type: "",
        writer_name: "",
        related_person: "",
        memo_content: "",
      });
      setAttachedFile(null);
      setShowAddForm(false);

      // 데이터 새로고침
      await fetchMemos();
      alert("메모가 성공적으로 등록되었습니다.");
    } catch (error) {
      console.error("메모 등록 실패:", error);
      alert("메모 등록 중 오류가 발생했습니다: " + (error.message || error));
    }
  };

  const handleEditMemo = async () => {
    if (!editingMemo) return;
    try {
      // 기존 데이터 저장 (로그용)
      const originalConsultation = consultations.find(
        (c) => c.id === editingMemo.id
      );

      // Supabase에서 상담 데이터 업데이트
      const { error } = await supabase
        .from("consultations")
        .update({
          memo_type: editingMemo.memo_type,
          writer_name: editingMemo.writer_name,
          related_person: editingMemo.related_person,
          memo_content: editingMemo.memo_content,
          attached_file_name: attachedFile
            ? attachedFile.name
            : editingMemo.attached_file_name,
          attached_file_url: attachedFile
            ? URL.createObjectURL(attachedFile)
            : editingMemo.attached_file_url,
          attached_file_size: attachedFile
            ? attachedFile.size
            : editingMemo.attached_file_size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingMemo.id);

      if (error) throw error;

      // 로그 기록
      const currentUser = await AdminAuth.getCurrentUser();
      if (currentUser && originalConsultation) {
        await AdminLogger.logActivity(
          currentUser.id,
          currentUser.name || "알 수 없음",
          currentUser.position_name || "알 수 없음",
          "UPDATE",
          "consultations",
          editingMemo.id.toString(),
          originalConsultation,
          editingMemo,
          `메모 수정: ${editingMemo.related_person}`,
          undefined,
          navigator.userAgent
        );
      }

      setEditingMemo(null);
      setAttachedFile(null);

      // 데이터 새로고침
      await fetchMemos();
      alert("메모가 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("메모 수정 실패:", error);
      alert("메모 수정 중 오류가 발생했습니다: " + (error.message || error));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMemos.size === 0) return;

    if (!confirm(`선택한 ${selectedMemos.size}개의 메모를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 삭제될 메모들 저장 (로그용)
      const deletedConsultations = consultations.filter((c) =>
        selectedMemos.has(c.id)
      );

      // Supabase에서 메모 데이터 삭제
      const { error } = await supabase
        .from("consultations")
        .delete()
        .in("id", Array.from(selectedMemos));

      if (error) throw error;

      // 로그 기록
      const currentUser = await AdminAuth.getCurrentUser();
      if (currentUser) {
        for (const consultation of deletedConsultations) {
          await AdminLogger.logActivity(
            currentUser.id,
            currentUser.name || "알 수 없음",
            currentUser.position_name || "알 수 없음",
            "DELETE",
            "consultations",
            consultation.id.toString(),
            consultation,
            null,
            `메모 삭제: ${consultation.related_person}`,
            undefined,
            navigator.userAgent
          );
        }
      }

      setSelectedMemos(new Set());

      // 데이터 새로고침
      await fetchMemos();
      alert(
        `${deletedConsultations.length}개의 메모가 성공적으로 삭제되었습니다.`
      );
    } catch (error) {
      console.error("메모 삭제 실패:", error);
      alert("메모 삭제 중 오류가 발생했습니다: " + (error.message || error));
    }
  };

  // 처리완료 핸들러
  const handleMarkAsProcessed = async (consultationId) => {
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ is_processed: true, processed_at: new Date().toISOString() })
        .eq("id", consultationId);

      if (error) throw error;

      // 로그 기록
      const currentUser = await AdminAuth.getCurrentUser();
      if (currentUser) {
        const consultation = consultations.find((c) => c.id === consultationId);
        await AdminLogger.logActivity(
          currentUser.id,
          currentUser.name || "알 수 없음",
          currentUser.position_name || "알 수 없음",
          "UPDATE",
          "consultations",
          consultationId.toString(),
          consultation,
          {
            ...consultation,
            is_processed: true,
            processed_at: new Date().toISOString(),
          },
          `상담 처리완료: ${consultation?.related_person || consultationId}`,
          undefined,
          navigator.userAgent
        );
      }

      // 데이터 새로고침
      await fetchMemos();
      alert("상담이 처리완료로 변경되었습니다.");
    } catch (error) {
      console.error("상담 처리완료 실패:", error);
      alert(
        "상담 처리완료 중 오류가 발생했습니다: " + (error.message || error)
      );
    }
  };

  // 처리취소 핸들러
  const handleMarkAsUnprocessed = async (consultationId) => {
    console.log("개별 처리취소 시작 - 상담 ID:", consultationId);

    try {
      console.log("처리취소 - Supabase 업데이트 시작");
      const { data, error } = await supabase
        .from("consultations")
        .update({ is_processed: false, processed_at: null })
        .eq("id", consultationId)
        .select()
        .single();

      if (error) {
        console.error("처리취소 - Supabase 업데이트 실패:", error);
        throw error;
      }

      console.log("처리취소 - Supabase 업데이트 성공:", data);

      // 로그 기록
      const currentUser = await AdminAuth.getCurrentUser();
      console.log("처리취소 - currentUser:", currentUser);

      if (currentUser) {
        const consultation = consultations.find((c) => c.id === consultationId);
        console.log("처리취소 - 찾은 상담:", consultation);

        try {
          await AdminLogger.logActivity(
            currentUser.id,
            currentUser.name || "알 수 없음",
            currentUser.position_name || "알 수 없음",
            "UPDATE",
            "consultations",
            consultationId.toString(),
            consultation,
            { ...consultation, is_processed: false, processed_at: null },
            `상담 처리취소: ${consultation?.related_person || consultationId}`,
            undefined,
            navigator.userAgent
          );
          console.log("처리취소 - 로그 기록 성공");
        } catch (logError) {
          console.error("처리취소 - 로그 기록 실패:", logError);
        }
      }

      // 데이터 새로고침
      console.log("처리취소 - 데이터 새로고침 시작");
      await fetchMemos();
      console.log("처리취소 - 데이터 새로고침 완료");

      alert("상담이 처리취소로 변경되었습니다.");
    } catch (error) {
      console.error("상담 처리취소 실패:", error);
      console.error("상담 처리취소 실패 - 오류 상세:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      alert(
        "상담 처리취소 중 오류가 발생했습니다: " + (error.message || error)
      );
    }
  };

  // 일괄 처리완료 핸들러
  const handleBulkMarkAsProcessed = async () => {
    if (selectedMemos.size === 0) return;

    if (
      !confirm(
        `선택한 ${selectedMemos.size}개의 상담을 처리완료로 변경하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      const currentUser = await AdminAuth.getCurrentUser();
      if (!currentUser) {
        alert("사용자 정보를 가져올 수 없습니다.");
        return;
      }

      // 각 상담을 처리완료로 변경
      for (const consultationId of selectedMemos) {
        const { error } = await supabase
          .from("consultations")
          .update({
            is_processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("id", consultationId);

        if (error) throw error;

        // 로그 기록
        const consultation = consultations.find((c) => c.id === consultationId);
        await AdminLogger.logActivity(
          currentUser.id,
          currentUser.name || "알 수 없음",
          currentUser.position_name || "알 수 없음",
          "UPDATE",
          "consultations",
          consultationId.toString(),
          consultation,
          {
            ...consultation,
            is_processed: true,
            processed_at: new Date().toISOString(),
          },
          `상담 일괄 처리완료: ${
            consultation?.related_person || consultationId
          }`,
          undefined,
          navigator.userAgent
        );
      }

      setSelectedMemos(new Set());
      await fetchMemos();
      alert(`${selectedMemos.size}개의 상담이 처리완료로 변경되었습니다.`);
    } catch (error) {
      console.error("상담 일괄 처리완료 실패:", error);
      alert(
        "상담 일괄 처리완료 중 오류가 발생했습니다: " + (error.message || error)
      );
    }
  };

  // 일괄 처리취소 핸들러
  const handleBulkMarkAsUnprocessed = async () => {
    console.log("일괄 처리취소 시작 - 선택된 상담 수:", selectedMemos.size);

    if (selectedMemos.size === 0) return;

    if (
      !confirm(
        `선택한 ${selectedMemos.size}개의 상담을 처리취소로 변경하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      console.log("일괄 처리취소 - 사용자 정보 가져오기 시작");
      const currentUser = await AdminAuth.getCurrentUser();
      console.log("일괄 처리취소 - currentUser:", currentUser);

      if (!currentUser) {
        alert("사용자 정보를 가져올 수 없습니다.");
        return;
      }

      const selectedIds = Array.from(selectedMemos);
      console.log("일괄 처리취소 - 선택된 ID들:", selectedIds);

      // 각 상담을 처리취소로 변경
      for (const consultationId of selectedIds) {
        console.log(`일괄 처리취소 - 상담 ${consultationId} 처리 시작`);

        const { error } = await supabase
          .from("consultations")
          .update({
            is_processed: false,
            processed_at: null,
          })
          .eq("id", consultationId);

        if (error) {
          console.error(
            `일괄 처리취소 - 상담 ${consultationId} 업데이트 실패:`,
            error
          );
          throw error;
        }

        console.log(`일괄 처리취소 - 상담 ${consultationId} 업데이트 성공`);

        // 로그 기록
        const consultation = consultations.find((c) => c.id === consultationId);
        console.log(
          `일괄 처리취소 - 상담 ${consultationId} 로그 기록 시작:`,
          consultation
        );

        try {
          await AdminLogger.logActivity(
            currentUser.id,
            currentUser.name || "알 수 없음",
            currentUser.position_name || "알 수 없음",
            "UPDATE",
            "consultations",
            consultationId.toString(),
            consultation,
            {
              ...consultation,
              is_processed: false,
              processed_at: null,
            },
            `상담 일괄 처리취소: ${
              consultation?.related_person || consultationId
            }`,
            undefined,
            navigator.userAgent
          );
          console.log(`일괄 처리취소 - 상담 ${consultationId} 로그 기록 성공`);
        } catch (logError) {
          console.error(
            `일괄 처리취소 - 상담 ${consultationId} 로그 기록 실패:`,
            logError
          );
          // 로그 기록 실패는 전체 작업을 중단시키지 않음
        }
      }

      console.log("일괄 처리취소 - 모든 상담 처리 완료, 선택 초기화");
      setSelectedMemos(new Set());

      console.log("일괄 처리취소 - 데이터 새로고침 시작");
      await fetchMemos();

      alert(`${selectedIds.length}개의 상담이 처리취소로 변경되었습니다.`);
      console.log("일괄 처리취소 - 완료");
    } catch (error) {
      console.error("상담 일괄 처리취소 실패:", error);
      console.error("상담 일괄 처리취소 실패 - 오류 상세:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      alert(
        "상담 일괄 처리취소 중 오류가 발생했습니다: " + (error.message || error)
      );
    }
  };

  // --- Utility Functions ---

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const generateConsultationNumber = (consultation, index) => {
    // 최신 상담이 #1이 되도록 역순으로 번호 생성
    const totalConsultations = consultations.length;
    const currentPageStart = (currentPage - 1) * ITEMS_PER_PAGE;
    const reverseIndex = totalConsultations - (currentPageStart + index);
    return `#${reverseIndex}`;
  };

  const formatConsultationContent = (content) => {
    if (!content) return [];
    return content.split("\n").map((line, i) => <li key={i}>{line}</li>);
  };

  const formatContentForEdit = (content) => {
    // This is a simple way to prepare content for textarea.
    // For more complex formatting (like rich text editors), this would be more involved.
    return content || "";
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const resetFilters = () => {
    setFilters({
      contentSearch: "",
      memoType: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1); // Reset to first page on filter reset
  };

  const handleSelectConsultation = (id) => {
    setSelectedMemos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentConsultationsOnPage = getCurrentPageConsultations();
    if (currentConsultationsOnPage.length === 0) return;

    const allSelected = currentConsultationsOnPage.every((consultation) =>
      selectedMemos.has(consultation.id)
    );

    setSelectedMemos((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        currentConsultationsOnPage.forEach((consultation) =>
          newSet.delete(consultation.id)
        );
      } else {
        currentConsultationsOnPage.forEach((consultation) =>
          newSet.add(consultation.id)
        );
      }
      return newSet;
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // In a real app, you'd fetch data for the new page here or rely on frontend pagination
  };

  const totalPages = Math.ceil(consultations.length / ITEMS_PER_PAGE);

  const getCurrentPageConsultations = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return consultations.slice(startIndex, endIndex);
  };

  // --- JSX Structure ---

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 상담 목록 */}
      <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {" "}
        {/* Added overflow-hidden */}
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
          {/* 탭 네비게이션 */}
          <div className="flex space-x-1 mb-4">
            <button
              onClick={() => setActiveTab("consultations")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "consultations"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              상담 관리
            </button>
          </div>

          {activeTab === "consultations" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  메모 관리
                </h1>
                <div className="flex items-center space-x-2">
                  {selectedMemos.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {selectedMemos.size}개 선택됨
                      </span>
                      <button
                        onClick={handleBulkMarkAsProcessed}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        처리완료
                      </button>
                      <button
                        onClick={handleBulkMarkAsUnprocessed}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                      >
                        처리취소
                      </button>
                      {canDelete && (
                        <button
                          onClick={handleBulkDelete}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          선택 삭제
                        </button>
                      )}
                    </div>
                  )}
                  {selectedMemos.size === 1 && (
                    <button
                      onClick={() => {
                        const selectedId = Array.from(selectedMemos)[0];
                        const consultation = consultations.find(
                          (c) => c.id === selectedId
                        );
                        if (consultation) {
                          setEditingMemo(consultation);
                        }
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      수정
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    메모 등록
                  </button>
                </div>
              </div>

              <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* 검색창 */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="메모 검색 (작성자, 메모내용, 관련인물 등)..."
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
                      {/* 메모종류 필터 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          메모종류
                        </label>
                        <select
                          value={filters.memoType}
                          onChange={(e) =>
                            updateFilter("memoType", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">전체 종류</option>
                          {MEMO_TYPES.map((type) => (
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
                          onChange={(e) =>
                            updateFilter("endDate", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 상담 목록 */}
              <div className="flex-1 overflow-y-auto">
                {" "}
                {/* Make this div scrollable */}
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    로딩 중...
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    메모기록이 없습니다
                  </div>
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
                                selectedMemos.has(consultation.id)
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

                    {getCurrentPageConsultations().map(
                      (consultation, index) => (
                        <div
                          key={consultation.id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            selectedMemo?.id === consultation.id
                              ? "bg-blue-50 border-r-2 border-blue-500"
                              : ""
                          } ${
                            selectedMemos.has(consultation.id)
                              ? "bg-yellow-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <input
                                type="checkbox"
                                checked={selectedMemos.has(consultation.id)}
                                onChange={() =>
                                  handleSelectConsultation(consultation.id)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => setSelectedMemo(consultation)}
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <span
                                    className={`text-sm font-medium ${
                                      consultation.is_processed === true ||
                                      consultation.is_processed === "true"
                                        ? "text-red-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {generateConsultationNumber(
                                      consultation,
                                      index // Use index for numbering on the current page
                                    )}
                                  </span>
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {consultation.memo_type}
                                  </span>
                                  {consultation.is_processed === true ||
                                  consultation.is_processed === "true" ? (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                                      처리완료
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                                      처리중
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mb-1">
                                  {consultation.related_person}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(
                                    consultation.consultation_date
                                  ).toLocaleString("ko-KR")}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {/* 개별 처리완료 버튼 제거 */}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* 페이지네이션 */}
              {consultations.length > 0 && totalPages > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        consultations.length
                      )}{" "}
                      / {consultations.length}개
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
            </>
          )}
        </div>
      </div>

      {/* 우측 상담 상세 */}
      {activeTab === "consultations" && (
        <div className="w-1/2 bg-white flex flex-col overflow-hidden">
          {" "}
          {/* Added flex-col and overflow-hidden */}
          {selectedMemo ? (
            <div className="h-full flex flex-col">
              {" "}
              {/* Ensure it takes full height */}
              {/* 상세 헤더 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      메모 상세
                    </h2>
                    {selectedMemo.is_processed === true ||
                    selectedMemo.is_processed === "true" ? (
                      <span className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-full">
                        처리완료
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-full">
                        처리중
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    전체 상담 건수: {stats.total}건
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {" "}
                {/* Make this div scrollable */}
                <div className="space-y-6">
                  {/* 상담 정보 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * 작성자
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedMemo.writer_name}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * 회원정보
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedMemo.related_person || "-"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * 메모내용
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        <ul className="list-disc list-inside space-y-1">
                          {formatConsultationContent(selectedMemo.memo_content)}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        * 첨부파일
                      </label>
                      {selectedMemo.attached_file_name ? (
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
                            href={selectedMemo.attached_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {selectedMemo.attached_file_name}
                          </a>
                          <span className="text-xs text-gray-500">
                            (
                            {formatFileSize(
                              selectedMemo.attached_file_size || 0
                            )}
                            )
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          첨부파일 없음
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              메모를 선택하세요
            </div>
          )}
        </div>
      )}

      {/* 새 상담 추가 모달 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">새 메모 등록</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모종류 *
                </label>
                <select
                  value={newMemo.memo_type}
                  onChange={(e) =>
                    setNewMemo({
                      ...newMemo,
                      memo_type: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">상담 종류 선택</option>{" "}
                  {/* Added default option */}
                  {MEMO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작성자 *
                </label>
                <input
                  type="text"
                  value={newMemo.writer_name}
                  onChange={(e) =>
                    setNewMemo({
                      ...newMemo,
                      writer_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회원이름
                </label>
                <input
                  type="text"
                  value={newMemo.related_person}
                  onChange={(e) =>
                    setNewMemo({
                      ...newMemo,
                      related_person: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모내용 *
                </label>
                <textarea
                  value={newMemo.memo_content}
                  onChange={(e) =>
                    setNewMemo({
                      ...newMemo,
                      memo_content: e.target.value,
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
                onClick={handleAddMemo}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메모 수정 모달 */}
      {editingMemo && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">메모 수정</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모종류 *
                </label>
                <select
                  value={editingMemo.memo_type}
                  onChange={(e) =>
                    setEditingMemo({
                      ...editingMemo,
                      memo_type: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">상담 종류 선택</option>{" "}
                  {/* Added default option */}
                  {MEMO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작성자 *
                </label>
                <input
                  type="text"
                  value={editingMemo.writer_name}
                  onChange={(e) =>
                    setEditingMemo({
                      ...editingMemo,
                      writer_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회원이름
                </label>
                <input
                  type="text"
                  value={editingMemo.related_person || ""}
                  onChange={(e) =>
                    setEditingMemo({
                      ...editingMemo,
                      related_person: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모내용 *
                </label>
                <textarea
                  value={formatContentForEdit(editingMemo.memo_content)}
                  onChange={(e) =>
                    setEditingMemo({
                      ...editingMemo,
                      memo_content: e.target.value,
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
                {editingMemo.attached_file_name && (
                  <div className="mb-2 text-sm text-gray-600">
                    현재 파일: {editingMemo.attached_file_name} (
                    {formatFileSize(editingMemo.attached_file_size || 0)})
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
                onClick={() => setEditingMemo(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleEditMemo}
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

export default AdminDashboard;
