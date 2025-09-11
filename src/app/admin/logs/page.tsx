"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminAuth } from "@/lib/admin-auth";
import { AdminLogger } from "@/lib/admin-logger";

function LogManagementPage() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activityStats, setActivityStats] = useState({ today: 0, thisWeek: 0 });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [filters, setFilters] = useState({
    actionType: "",
    adminUsername: "",
    startDate: "",
    endDate: "",
  });

  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const checkAdminPermission = async () => {
    try {
      const hasPermission = await AdminAuth.hasRoleLevel(1); // 최고 관리자 권한 체크
      setIsSuperAdmin(hasPermission);
    } catch (error) {
      console.error("권한 체크 실패:", error);
      setIsSuperAdmin(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchActivityLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      // 실제 Supabase에서 로그 데이터 가져오기
      const logs = await AdminLogger.getActivityLogs({
        actionType: filters.actionType || undefined,
        adminUsername: filters.adminUsername || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 100,
      });

      setActivityLogs(logs);

      // 통계 데이터 가져오기
      const stats = await AdminLogger.getActivityStats();
      setActivityStats(stats);
    } catch (error) {
      console.error("로그 데이터 로딩 실패:", error);
      setActivityLogs([]);
      setActivityStats({ today: 0, thisWeek: 0 });
    } finally {
      setLogsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    checkAdminPermission();
  }, []);

  useEffect(() => {
    if (isSuperAdmin && !isCheckingAuth) {
      fetchActivityLogs();
    }
  }, [isSuperAdmin, isCheckingAuth, fetchActivityLogs]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  // 페이징 관련 함수들
  const getCurrentPageLogs = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return activityLogs.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(activityLogs.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const resetFilters = () => {
    setFilters({
      actionType: "",
      adminUsername: "",
      startDate: "",
      endDate: "",
    });
  };

  // 필터링된 로그 (통계용)
  const filteredLogs = activityLogs.filter((log) => {
    if (filters.actionType && log.action_type !== filters.actionType) {
      return false;
    }
    if (
      filters.adminUsername &&
      !log.admin_username
        .toLowerCase()
        .includes(filters.adminUsername.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.startDate &&
      new Date(log.created_at) < new Date(filters.startDate)
    ) {
      return false;
    }
    if (
      filters.endDate &&
      new Date(log.created_at) > new Date(filters.endDate + "T23:59:59")
    ) {
      return false;
    }
    return true;
  });

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">권한 확인 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              접근 권한 없음
            </h2>
            <p className="text-gray-600 mb-4">
              로그 관리 페이지는 최고 관리자만 접근할 수 있습니다.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              이전 페이지로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 로그 목록 */}
      <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">로그 관리</h1>
            <div className="text-sm text-gray-500">
              전체 로그: {activityLogs.length}개
            </div>
          </div>

          {/* 필터 */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 검색창 */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="관리자명 검색..."
                    value={filters.adminUsername}
                    onChange={(e) =>
                      updateFilter("adminUsername", e.target.value)
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
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 필터 옵션 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 액션 타입 필터 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    액션 타입
                  </label>
                  <select
                    value={filters.actionType}
                    onChange={(e) => updateFilter("actionType", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">전체 타입</option>
                    <option value="CREATE">생성</option>
                    <option value="UPDATE">수정</option>
                    <option value="DELETE">삭제</option>
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
                    onChange={(e) => updateFilter("startDate", e.target.value)}
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
          </div>
        </div>

        {/* 로그 목록 */}
        <div className="flex-1 overflow-y-auto">
          {logsLoading ? (
            <div className="p-4 text-center text-gray-500">로딩 중...</div>
          ) : activityLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">로그가 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {getCurrentPageLogs().map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          log.action_type === "CREATE"
                            ? "bg-green-100 text-green-800"
                            : log.action_type === "UPDATE"
                            ? "bg-blue-100 text-blue-800"
                            : log.action_type === "DELETE"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {log.action_type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {log.admin_username}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({log.admin_role_name})
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">{log.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      테이블: {log.table_name}
                      {log.record_id && ` | ID: ${log.record_id}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {activityLogs.length > 0 && getTotalPages() > 1 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, activityLogs.length)} /{" "}
                  {activityLogs.length}개
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>

                  {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(
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
                    disabled={currentPage === getTotalPages()}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 우측 통계 및 상세 */}
      <div className="w-1/2 bg-white flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            활동 통계
          </h2>

          {/* 통계 카드 */}
          {activityStats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">오늘 활동</div>
                <div className="text-2xl font-bold text-blue-700">
                  {activityStats.today}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">이번 주 활동</div>
                <div className="text-2xl font-bold text-green-700">
                  {activityStats.thisWeek}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 액션 타입별 통계 */}
        <div className="p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            액션 타입별 통계
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  생성 (CREATE)
                </span>
              </div>
              <span className="text-sm font-bold text-green-700">
                {
                  filteredLogs.filter((log) => log.action_type === "CREATE")
                    .length
                }
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  수정 (UPDATE)
                </span>
              </div>
              <span className="text-sm font-bold text-blue-700">
                {
                  filteredLogs.filter((log) => log.action_type === "UPDATE")
                    .length
                }
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  삭제 (DELETE)
                </span>
              </div>
              <span className="text-sm font-bold text-red-700">
                {
                  filteredLogs.filter((log) => log.action_type === "DELETE")
                    .length
                }
              </span>
            </div>
          </div>
        </div>

        {/* 관리자별 활동 통계 */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            관리자별 활동
          </h3>
          <div className="space-y-2">
            {Array.from(
              new Set(filteredLogs.map((log) => log.admin_username))
            ).map((username) => {
              const userLogs = filteredLogs.filter(
                (log) => log.admin_username === username
              );
              const role = userLogs[0]?.admin_role_name;
              return (
                <div
                  key={username}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {username}
                    </div>
                    <div className="text-xs text-gray-500">{role}</div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {userLogs.length}회
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogManagementPage;
