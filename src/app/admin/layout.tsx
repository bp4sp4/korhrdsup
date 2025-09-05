"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  // 기본 페이지를 학생관리로 리다이렉트
  useEffect(() => {
    if (pathname === "/admin") {
      router.push("/admin/students");
    }
  }, [pathname, router]);

  const checkAuth = async () => {
    const { user, error } = await getCurrentUser();
    if (error || !user) {
      router.push("/admin/login");
      return;
    }
    setUser(user);
    setLoading(false);
  };

  // 로그인 페이지는 레이아웃에서 제외
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader user={user} />
        <main className="py-6">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
