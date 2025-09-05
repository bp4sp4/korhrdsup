"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, getSession } from "@/lib/auth";
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
    try {
      // 환경 변수 확인
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.error("Supabase environment variables not set");
        router.push("/admin/login");
        return;
      }

      // 먼저 세션을 확인
      const { session, error: sessionError } = await getSession();

      if (sessionError) {
        console.log("Session error:", sessionError);
        router.push("/admin/login");
        return;
      }

      if (!session) {
        console.log("No session found");
        router.push("/admin/login");
        return;
      }

      // 세션이 있으면 사용자 정보 가져오기
      const { user, error: userError } = await getCurrentUser();

      if (userError || !user) {
        console.log("User error:", userError);
        router.push("/admin/login");
        return;
      }

      console.log("User authenticated:", user.email);
      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      // 타임아웃이나 오류 시 로그인 페이지로 리다이렉트
      router.push("/admin/login");
    }
  };

  // 로그인 페이지는 레이아웃에서 제외
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">로딩 중...</div>
          <div className="text-sm text-gray-500 mt-2">인증 확인 중입니다</div>
        </div>
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
