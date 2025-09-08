"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

// 실습교육원 인터페이스
interface EducationCenter {
  id: string;
  center_name: string; // 실습교육원명
  practice_type: string; // 실습종류
  location: string; // 실습교육원 위치 지역
  practice_available_area: string; // 실습가능 지역
  semester: string; // 학기
  law_type: string; // 법
  seminar_day: string; // 세미나 요일
  seminar_count: string; // 세미나 횟수
  website_url?: string; // 웹사이트 URL
  created_at: string;
  updated_at: string;
}

// 실습기관 인터페이스
interface PracticeInstitution {
  id: string;
  institution_name: string; // 실습기관명
  location: string; // 실습기관 위치
  practice_area: string; // 실습지역
  schedule_type: string; // 실습일정 종류
  cost: string; // 비용
  created_at: string;
  updated_at: string;
}

export default function InstitutionsPage() {
  const [activeTab, setActiveTab] = useState<"education" | "institution">(
    "education"
  );

  // 실습교육원 관련 상태
  const [educationCenters, setEducationCenters] = useState<EducationCenter[]>(
    []
  );
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [editingEducation, setEditingEducation] =
    useState<EducationCenter | null>(null);
  const [educationForm, setEducationForm] = useState<Partial<EducationCenter>>(
    {}
  );
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);

  // 실습기관 관련 상태
  const [practiceInstitutions, setPracticeInstitutions] = useState<
    PracticeInstitution[]
  >([]);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [editingInstitution, setEditingInstitution] =
    useState<PracticeInstitution | null>(null);
  const [institutionForm, setInstitutionForm] = useState<
    Partial<PracticeInstitution>
  >({});
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>(
    []
  );

  // 필터링 상태
  const [educationFilters, setEducationFilters] = useState({
    center_name: "",
    practice_type: "",
    semester: "",
    law_type: "",
    seminar_day: "",
    seminar_count: "",
    location: "",
    practice_available_area: "",
    website_url: "",
  });

  const [institutionFilters, setInstitutionFilters] = useState({
    institution_name: "",
    location: "",
    practice_area: "",
    schedule_type: "",
    cost: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showEducationFilters, setShowEducationFilters] = useState(false);
  const [showInstitutionFilters, setShowInstitutionFilters] = useState(false);

  // 페이지네이션 상태
  const [currentEducationPage, setCurrentEducationPage] = useState(1);
  const [currentInstitutionPage, setCurrentInstitutionPage] = useState(1);
  const itemsPerPage = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchEducationCenters(), fetchPracticeInstitutions()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationCenters = async () => {
    const { data, error } = await supabase
      .from("education_centers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setEducationCenters(data || []);
  };

  const fetchPracticeInstitutions = async () => {
    const { data, error } = await supabase
      .from("practice_institutions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setPracticeInstitutions(data || []);
  };

  // 실습교육원 CRUD
  const handleEducationEdit = (center: EducationCenter) => {
    setEditingEducation(center);
    setEducationForm(center);
    setShowEducationModal(true);
  };

  const handleEducationSave = async () => {
    try {
      if (editingEducation) {
        const { error } = await (supabase as any)
          .from("education_centers")
          .update(educationForm)
          .eq("id", editingEducation.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("education_centers")
          .insert([educationForm]);
        if (error) throw error;
      }

      await fetchEducationCenters();
      handleEducationCancel();
      setError(null); // 성공 시 에러 메시지 초기화
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    }
  };

  const handleEducationCancel = () => {
    setEditingEducation(null);
    setEducationForm({});
    setShowEducationModal(false);
  };

  const handleEducationDelete = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 실습교육원을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true); // 로딩 상태 시작

      const { error } = await supabase
        .from("education_centers")
        .delete()
        .in("id", ids);

      if (error) throw error;

      // 로컬 상태에서 즉시 제거하여 UI 반응성 개선
      setEducationCenters((prev) =>
        prev.filter((center) => !ids.includes(center.id))
      );
      setSelectedEducation([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      // 실패 시 데이터 다시 로드
      await fetchEducationCenters();
    } finally {
      setLoading(false); // 로딩 상태 종료
    }
  };

  const handleEducationSelect = (centerId: string) => {
    setSelectedEducation((prev) =>
      prev.includes(centerId)
        ? prev.filter((id) => id !== centerId)
        : [...prev, centerId]
    );
  };

  const handleEducationSelectAll = () => {
    const currentPageIds = paginatedEducationCenters.map((c) => c.id);
    const allCurrentPageSelected = currentPageIds.every((id) =>
      selectedEducation.includes(id)
    );

    if (allCurrentPageSelected) {
      // 현재 페이지의 모든 항목이 선택되어 있으면 해제
      setSelectedEducation((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      // 현재 페이지의 모든 항목을 선택
      setSelectedEducation((prev) => {
        const newSelection = [...prev];
        currentPageIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // 실습기관 CRUD
  const handleInstitutionEdit = (institution: PracticeInstitution) => {
    setEditingInstitution(institution);
    setInstitutionForm(institution);
    setShowInstitutionModal(true);
  };

  const handleInstitutionSave = async () => {
    try {
      if (editingInstitution) {
        const { error } = await (supabase as any)
          .from("practice_institutions")
          .update(institutionForm)
          .eq("id", editingInstitution.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("practice_institutions")
          .insert([institutionForm]);
        if (error) throw error;
      }

      await fetchPracticeInstitutions();
      handleInstitutionCancel();
      setError(null); // 성공 시 에러 메시지 초기화
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    }
  };

  const handleInstitutionCancel = () => {
    setEditingInstitution(null);
    setInstitutionForm({});
    setShowInstitutionModal(false);
  };

  const handleInstitutionDelete = async (ids: string[]) => {
    if (!confirm(`선택한 ${ids.length}개의 실습기관을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true); // 로딩 상태 시작

      const { error } = await supabase
        .from("practice_institutions")
        .delete()
        .in("id", ids);

      if (error) throw error;

      // 로컬 상태에서 즉시 제거하여 UI 반응성 개선
      setPracticeInstitutions((prev) =>
        prev.filter((institution) => !ids.includes(institution.id))
      );
      setSelectedInstitutions([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      // 실패 시 데이터 다시 로드
      await fetchPracticeInstitutions();
    } finally {
      setLoading(false); // 로딩 상태 종료
    }
  };

  const handleInstitutionSelect = (institutionId: string) => {
    setSelectedInstitutions((prev) =>
      prev.includes(institutionId)
        ? prev.filter((id) => id !== institutionId)
        : [...prev, institutionId]
    );
  };

  const handleInstitutionSelectAll = () => {
    const currentPageIds = paginatedPracticeInstitutions.map((i) => i.id);
    const allCurrentPageSelected = currentPageIds.every((id) =>
      selectedInstitutions.includes(id)
    );

    if (allCurrentPageSelected) {
      // 현재 페이지의 모든 항목이 선택되어 있으면 해제
      setSelectedInstitutions((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      // 현재 페이지의 모든 항목을 선택
      setSelectedInstitutions((prev) => {
        const newSelection = [...prev];
        currentPageIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // 필터링된 데이터
  const filteredEducationCenters = educationCenters.filter((center) => {
    const matchesSearch =
      !searchTerm ||
      center.center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.practice_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.practice_available_area
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      center.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (center.website_url &&
        center.website_url.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilters = Object.entries(educationFilters).every(
      ([key, value]) => {
        if (!value) return true;
        const centerValue = center[key as keyof EducationCenter];
        return (
          centerValue?.toString().toLowerCase().includes(value.toLowerCase()) ??
          false
        );
      }
    );

    return matchesSearch && matchesFilters;
  });

  const filteredPracticeInstitutions = practiceInstitutions.filter(
    (institution) => {
      const matchesSearch =
        !searchTerm ||
        institution.institution_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        institution.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        institution.practice_area
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        institution.schedule_type
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesFilters = Object.entries(institutionFilters).every(
        ([key, value]) => {
          if (!value) return true;
          const institutionValue =
            institution[key as keyof PracticeInstitution];
          return (
            institutionValue
              ?.toString()
              .toLowerCase()
              .includes(value.toLowerCase()) ?? false
          );
        }
      );

      return matchesSearch && matchesFilters;
    }
  );

  // 필터 초기화
  const resetEducationFilters = () => {
    setEducationFilters({
      center_name: "",
      practice_type: "",
      semester: "",
      law_type: "",
      seminar_day: "",
      seminar_count: "",
      location: "",
      practice_available_area: "",
      website_url: "",
    });
  };

  const resetInstitutionFilters = () => {
    setInstitutionFilters({
      institution_name: "",
      location: "",
      practice_area: "",
      schedule_type: "",
      cost: "",
    });
  };

  // 페이지네이션 로직
  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const paginatedEducationCenters = getPaginatedData(
    filteredEducationCenters,
    currentEducationPage
  );
  const paginatedPracticeInstitutions = getPaginatedData(
    filteredPracticeInstitutions,
    currentInstitutionPage
  );

  const totalEducationPages = getTotalPages(filteredEducationCenters);
  const totalInstitutionPages = getTotalPages(filteredPracticeInstitutions);

  // 페이지 변경 시 스크롤을 맨 위로
  const handleEducationPageChange = (page: number) => {
    setCurrentEducationPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInstitutionPageChange = (page: number) => {
    setCurrentInstitutionPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 검색어나 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentEducationPage(1);
  }, [searchTerm, educationFilters]);

  useEffect(() => {
    setCurrentInstitutionPage(1);
  }, [searchTerm, institutionFilters]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="flex-1 p-6 max-w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">실습기관 관리</h1>
            <p className="text-gray-600">실습교육원과 실습기관을 관리합니다.</p>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div className="text-red-800">{error}</div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg
                      className="w-5 h-5"
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
              </div>
            )}
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => {
                    setActiveTab("education");
                    setSearchTerm("");
                    setShowEducationFilters(false);
                    setShowInstitutionFilters(false);
                    setCurrentEducationPage(1);
                    setCurrentInstitutionPage(1);
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "education"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  실습교육원 관리
                </button>
                <button
                  onClick={() => {
                    setActiveTab("institution");
                    setSearchTerm("");
                    setShowEducationFilters(false);
                    setShowInstitutionFilters(false);
                    setCurrentEducationPage(1);
                    setCurrentInstitutionPage(1);
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "institution"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  실습기관 관리
                </button>
              </nav>
            </div>
          </div>

          {/* 실습교육원 탭 */}
          {activeTab === "education" && (
            <div>
              {/* 검색 및 필터링 UI */}
              <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* 검색창 */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="실습교육원 검색..."
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
                      onClick={() =>
                        setShowEducationFilters(!showEducationFilters)
                      }
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        showEducationFilters
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
                      onClick={resetEducationFilters}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      초기화
                    </button>
                  </div>
                </div>

                {/* 필터 드롭다운 */}
                {showEducationFilters && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          실습교육원명
                        </label>
                        <input
                          type="text"
                          value={educationFilters.center_name}
                          onChange={(e) =>
                            setEducationFilters({
                              ...educationFilters,
                              center_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="예: 강서구"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          실습종류
                        </label>
                        <select
                          value={educationFilters.practice_type}
                          onChange={(e) =>
                            setEducationFilters({
                              ...educationFilters,
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
                          학기
                        </label>
                        <select
                          value={educationFilters.semester}
                          onChange={(e) =>
                            setEducationFilters({
                              ...educationFilters,
                              semester: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">전체</option>
                          <option value="25년도 2학기">25년도 2학기</option>
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
                          법
                        </label>
                        <select
                          value={educationFilters.law_type}
                          onChange={(e) =>
                            setEducationFilters({
                              ...educationFilters,
                              law_type: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">전체</option>
                          <option value="신법 160시간">신법 160시간</option>
                          <option value="구법 120시간">구법 120시간</option>
                          <option value="보육 240시간">보육 240시간</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          세미나 요일
                        </label>
                        <select
                          value={educationFilters.seminar_day}
                          onChange={(e) =>
                            setEducationFilters({
                              ...educationFilters,
                              seminar_day: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">전체</option>
                          <option value="주말">주말</option>
                          <option value="평일">평일</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          웹사이트 URL
                        </label>
                        <input
                          type="text"
                          value={educationFilters.website_url}
                          onChange={(e) =>
                            setEducationFilters({
                              ...educationFilters,
                              website_url: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="예: https://"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    총 {filteredEducationCenters.length}개의 실습교육원
                  </span>
                  {selectedEducation.length > 0 && (
                    <span className="text-sm text-blue-600">
                      {selectedEducation.length}개 선택됨
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowEducationModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    실습교육원 추가
                  </button>
                  {selectedEducation.length > 0 && (
                    <button
                      onClick={() => handleEducationDelete(selectedEducation)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-md text-sm transition-colors ${
                        loading
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {loading ? "삭제 중..." : "선택 삭제"}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  className="overflow-x-auto max-w-full"
                  style={{ maxWidth: "100vw" }}
                >
                  <table className="w-full min-w-[1400px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[50px]">
                          <input
                            type="checkbox"
                            checked={
                              paginatedEducationCenters.length > 0 &&
                              paginatedEducationCenters.every((center) =>
                                selectedEducation.includes(center.id)
                              )
                            }
                            onChange={handleEducationSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                          실습교육원명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                          실습종류
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                          교육원 위치
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                          실습가능 지역
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                          학기
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                          법
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                          세미나 요일
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                          세미나 횟수
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedEducationCenters.map((center) => (
                        <tr key={center.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 min-w-[50px]">
                            <input
                              type="checkbox"
                              checked={selectedEducation.includes(center.id)}
                              onChange={() => handleEducationSelect(center.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                            {center.website_url ? (
                              <a
                                href={center.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {center.center_name}
                                <svg
                                  className="inline w-3 h-3 ml-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-500">
                                {center.center_name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                            {center.practice_type}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                            {center.location}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                            {center.practice_available_area}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                            {center.semester}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                            {center.law_type}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                            {center.seminar_day}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                            {center.seminar_count}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium min-w-[80px]">
                            <button
                              onClick={() => handleEducationEdit(center)}
                              className="text-blue-600 hover:text-blue-900 text-xs whitespace-nowrap"
                            >
                              수정
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 페이지네이션 */}
              {totalEducationPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    총 {filteredEducationCenters.length}개 중{" "}
                    {(currentEducationPage - 1) * itemsPerPage + 1}-
                    {Math.min(
                      currentEducationPage * itemsPerPage,
                      filteredEducationCenters.length
                    )}
                    개 표시
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleEducationPageChange(currentEducationPage - 1)
                      }
                      disabled={currentEducationPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>

                    {Array.from(
                      { length: totalEducationPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handleEducationPageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentEducationPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        handleEducationPageChange(currentEducationPage + 1)
                      }
                      disabled={currentEducationPage === totalEducationPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 실습기관 탭 */}
          {activeTab === "institution" && (
            <div>
              {/* 검색 및 필터링 UI */}
              <div className="mb-6 bg-white rounded-lg shadow p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* 검색창 */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="실습기관 검색..."
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
                      onClick={() =>
                        setShowInstitutionFilters(!showInstitutionFilters)
                      }
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        showInstitutionFilters
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
                      onClick={resetInstitutionFilters}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      초기화
                    </button>
                  </div>
                </div>

                {/* 필터 드롭다운 */}
                {showInstitutionFilters && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          실습일정 종류
                        </label>
                        <select
                          value={institutionFilters.schedule_type}
                          onChange={(e) =>
                            setInstitutionFilters({
                              ...institutionFilters,
                              schedule_type: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">전체</option>
                          <option value="주말">주말</option>
                          <option value="평일">평일</option>
                          <option value="조율">조율</option>
                          <option value="야간">야간</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          기관 위치
                        </label>
                        <input
                          type="text"
                          value={institutionFilters.location}
                          onChange={(e) =>
                            setInstitutionFilters({
                              ...institutionFilters,
                              location: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="예: 서울시 강서구"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          실습지역
                        </label>
                        <input
                          type="text"
                          value={institutionFilters.practice_area}
                          onChange={(e) =>
                            setInstitutionFilters({
                              ...institutionFilters,
                              practice_area: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="예: 서울시 강서구"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    총 {filteredPracticeInstitutions.length}개의 실습기관
                  </span>
                  {selectedInstitutions.length > 0 && (
                    <span className="text-sm text-blue-600">
                      {selectedInstitutions.length}개 선택됨
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowInstitutionModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    실습기관 추가
                  </button>
                  {selectedInstitutions.length > 0 && (
                    <button
                      onClick={() =>
                        handleInstitutionDelete(selectedInstitutions)
                      }
                      disabled={loading}
                      className={`px-4 py-2 rounded-md text-sm transition-colors ${
                        loading
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {loading ? "삭제 중..." : "선택 삭제"}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  className="overflow-x-auto max-w-full"
                  style={{ maxWidth: "100vw" }}
                >
                  <table className="w-full min-w-[1000px] divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[50px]">
                          <input
                            type="checkbox"
                            checked={
                              paginatedPracticeInstitutions.length > 0 &&
                              paginatedPracticeInstitutions.every(
                                (institution) =>
                                  selectedInstitutions.includes(institution.id)
                              )
                            }
                            onChange={handleInstitutionSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                          실습기관명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                          기관 위치
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                          실습지역
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                          실습일정
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">
                          비용
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPracticeInstitutions.map((institution) => (
                        <tr key={institution.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 min-w-[50px]">
                            <input
                              type="checkbox"
                              checked={selectedInstitutions.includes(
                                institution.id
                              )}
                              onChange={() =>
                                handleInstitutionSelect(institution.id)
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                            {institution.institution_name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                            {institution.location}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                            {institution.practice_area}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                            {institution.schedule_type}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px]">
                            {institution.cost}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium min-w-[80px]">
                            <button
                              onClick={() => handleInstitutionEdit(institution)}
                              className="text-blue-600 hover:text-blue-900 text-xs whitespace-nowrap"
                            >
                              수정
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 페이지네이션 */}
              {totalInstitutionPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    총 {filteredPracticeInstitutions.length}개 중{" "}
                    {(currentInstitutionPage - 1) * itemsPerPage + 1}-
                    {Math.min(
                      currentInstitutionPage * itemsPerPage,
                      filteredPracticeInstitutions.length
                    )}
                    개 표시
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleInstitutionPageChange(currentInstitutionPage - 1)
                      }
                      disabled={currentInstitutionPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>

                    {Array.from(
                      { length: totalInstitutionPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handleInstitutionPageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentInstitutionPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        handleInstitutionPageChange(currentInstitutionPage + 1)
                      }
                      disabled={
                        currentInstitutionPage === totalInstitutionPages
                      }
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 실습교육원 편집 모달 */}
          {showEducationModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingEducation ? "실습교육원 수정" : "실습교육원 추가"}
                    </h3>
                    <button
                      onClick={handleEducationCancel}
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습교육원명
                      </label>
                      <input
                        type="text"
                        value={educationForm.center_name || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            center_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 강서구 사회복지교육원"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습종류
                      </label>
                      <select
                        value={educationForm.practice_type || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            practice_type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="사회복지사">사회복지사</option>
                        <option value="보육교사">보육교사</option>
                        <option value="한국어교원">한국어교원</option>
                        <option value="평생교육사">평생교육사</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        학기
                      </label>
                      <select
                        value={educationForm.semester || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            semester: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="25년도 2학기">25년도 2학기</option>
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
                        법
                      </label>
                      <select
                        value={educationForm.law_type || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            law_type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="신법 160시간">신법 160시간</option>
                        <option value="구법 120시간">구법 120시간</option>
                        <option value="보육 240시간">보육 240시간</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        세미나 요일
                      </label>
                      <select
                        value={educationForm.seminar_day || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            seminar_day: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="주말">주말</option>
                        <option value="평일">평일</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        세미나 횟수
                      </label>
                      <select
                        value={educationForm.seminar_count || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            seminar_count: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="1~2회">1~2회</option>
                        <option value="3회~5회">3회~5회</option>
                        <option value="6회~8회">6회~8회</option>
                        <option value="8회~15회">8회~15회</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습교육원 위치 지역
                      </label>
                      <input
                        type="text"
                        value={educationForm.location || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 서울시 화곡동"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습가능 지역
                      </label>
                      <input
                        type="text"
                        value={educationForm.practice_available_area || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            practice_available_area: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 서울시 강서구"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        웹사이트 URL (선택사항)
                      </label>
                      <input
                        type="url"
                        value={educationForm.website_url || ""}
                        onChange={(e) =>
                          setEducationForm({
                            ...educationForm,
                            website_url: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: https://example.com"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={handleEducationCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleEducationSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 실습기관 편집 모달 */}
          {showInstitutionModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingInstitution ? "실습기관 수정" : "실습기관 추가"}
                    </h3>
                    <button
                      onClick={handleInstitutionCancel}
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습기관명
                      </label>
                      <input
                        type="text"
                        value={institutionForm.institution_name || ""}
                        onChange={(e) =>
                          setInstitutionForm({
                            ...institutionForm,
                            institution_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 서울시 강서구 사회복지관"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습일정 종류
                      </label>
                      <select
                        value={institutionForm.schedule_type || ""}
                        onChange={(e) =>
                          setInstitutionForm({
                            ...institutionForm,
                            schedule_type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="주말">주말</option>
                        <option value="평일">평일</option>
                        <option value="조율">조율</option>
                        <option value="야간">야간</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        비용
                      </label>
                      <input
                        type="text"
                        value={institutionForm.cost || ""}
                        onChange={(e) =>
                          setInstitutionForm({
                            ...institutionForm,
                            cost: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 50,000원"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습기관 위치
                      </label>
                      <input
                        type="text"
                        value={institutionForm.location || ""}
                        onChange={(e) =>
                          setInstitutionForm({
                            ...institutionForm,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 서울시 강서구 화곡동"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        실습지역
                      </label>
                      <input
                        type="text"
                        value={institutionForm.practice_area || ""}
                        onChange={(e) =>
                          setInstitutionForm({
                            ...institutionForm,
                            practice_area: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 서울시 강서구"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={handleInstitutionCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleInstitutionSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
