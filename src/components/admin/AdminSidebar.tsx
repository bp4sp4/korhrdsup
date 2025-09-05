"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "학생 관리",
    href: "/admin/students",
    icon: "👥",
    description: "학생 정보 및 실습신청 관리",
  },
  {
    name: "실습기관 관리",
    href: "/admin/institutions",
    icon: "🏢",
    description: "실습기관 및 교육원 관리",
  },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isCollapsed ? "-translate-x-full" : "translate-x-0"
      } lg:translate-x-0`}
    >
      {/* 모바일 오버레이 */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div className="flex flex-col h-full">
        {/* 로고 */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-5 h-5  flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                <img src="/logo.png" alt="" />
              </span>
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">
              한평생실습지원센터
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
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

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 하단 정보 */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            실습신청 관리 시스템 v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
