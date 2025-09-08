"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase-client";
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  // 세션 변경 감지
  useEffect(() => {
    if (!mounted) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in:", session.user.email);
        setUser(session.user);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setUser(null);
        setLoading(false);
        router.push("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [mounted, router]);

  useEffect(() => {
    if (pathname === "/admin") {
      router.push("/admin/students");
    }
  }, [pathname, router]);

  const checkAuth = async () => {
    try {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.error("Supabase environment variables not set");
        setLoading(false);
        router.push("/admin/login");
        return;
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout")), 5000)
      );

      const authPromise = async () => {
        const { session, error: sessionError } = await getSession();

        if (sessionError) {
          console.log("Session error:", sessionError);
          return { success: false, error: sessionError };
        }

        if (!session) {
          console.log("No session found");
          return { success: false, error: "No session" };
        }

        const { user, error: userError } = await getCurrentUser();

        if (userError || !user) {
          console.log("User error:", userError);
          return { success: false, error: userError };
        }

        console.log("User authenticated:", user.email);
        return { success: true, user };
      };

      const result = (await Promise.race([
        authPromise(),
        timeoutPromise,
      ])) as any;

      if (result.success) {
        setUser(result.user);
        setLoading(false);
      } else {
        console.log("Auth failed:", result.error);
        setLoading(false);
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setLoading(false);
      router.push("/admin/login");
    }
  };

  // 로그인 페이지는 레이아웃에서 제외
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 클라이언트 사이드에서만 로딩 상태 렌더링
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">로딩 중...</div>
          <div className="text-sm text-gray-500 mt-2">인증 확인 중입니다</div>
          {mounted && (
            <div className="text-xs text-gray-400 mt-4">
              로딩이 오래 걸리면 페이지를 새로고침해주세요
            </div>
          )}
        </div>
      </div>
    );
  }

  // 사용자가 없을 때 리다이렉트 처리
  useEffect(() => {
    if (!user && mounted && !loading) {
      console.log("No user found, redirecting to login");
      router.push("/admin/login");
    }
  }, [user, mounted, loading, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600">
            사용자 정보를 확인하는 중...
          </div>
        </div>
      </div>
    );
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
