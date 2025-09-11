import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header showHomeLink={false} />

      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              실습신청을
              <span className="text-blue-600 ">
                <br className="md:hidden" />
                <span className="md:hidden"></span>
                간편하게
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              실습신청서를 작성해 주시면 담당자가
              <br />
              확인 후 순차적으로 섭외해 드립니다.
            </p>

            <div className="flex justify-center">
              <Link
                href="/consultation"
                className="inline-flex items-center md:px-35 px-18 py-6 bg-blue-500 text-white text-xl font-semibold rounded-2xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                실습신청 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              왜 한평생에서
              <br className="md:hidden block" /> 실습을 진행해야 할까요?
            </h2>
            <p className="text-lg text-gray-600">
              간편하고 안전한 실습신청 경험을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl hover:bg-gray-50 transition-all duration-200">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                빠른 신청
              </h3>
              <p className="text-gray-600">
                5분이면 끝! 복잡한 절차 없이 간편하게
                <br /> 실습신청을 완료할 수 있습니다.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:bg-gray-50 transition-all duration-200">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                안전한 관리
              </h3>
              <p className="text-gray-600">
                전문 담당자가 체계적으로 관리하여 안전하고
                <br /> 신뢰할 수 있는 실습 환경을 제공합니다.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:bg-gray-50 transition-all duration-200">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                1:1 맞춤 섭외
              </h3>
              <p className="text-gray-600">
                상황에 맞춰 가장 적합하고 가까운 곳으로
                <br /> 연결해 드리며, 개인 사유로 인한
                <br /> 재연계 요청 시 비용이 발생합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 신청 과정 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              간단한 3단계로 완료
            </h2>
            <p className="text-lg text-gray-600">
              복잡하지 않아요. 몇 번의 클릭으로 끝납니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                정보 입력
              </h3>
              <p className="text-gray-600">
                기본 정보와 실습 희망 사항을 입력해주세요.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                검토 대기
              </h3>
              <p className="text-gray-600">
                담당자가 신청서를 검토하고 연락드립니다.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                실습 시작
              </h3>
              <p className="text-gray-600">
                모든 절차가 완료되면 실습을 시작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            실습신청은 지금 당장 시작할 수 있습니다.
          </p>
          <Link
            href="/consultation"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-2xl hover:bg-gray-50   "
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            실습신청 시작하기
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
