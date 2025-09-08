"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";

export default function PrivacyInfoPage() {
  const images = ["/001.png", "/002.png", "/003.png", "/004.png"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 페이지 제목 */}

          {/* 이미지 표시 영역 */}
          <div className="p-6">
            <div className="space-y-8">
              {images.map((image, index) => (
                <div key={index} className="flex justify-center">
                  <div className="relative max-w-full">
                    <Image
                      src={image}
                      alt={`실습 신청 안내 ${index + 1}`}
                      width={800}
                      height={600}
                      className="rounded-lg shadow-lg"
                      priority={index === 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <Link
              href="/consultation"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              실습 신청으로 돌아가기
            </Link>
            <Link
              href="/"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              홈으로
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
