import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header showHomeLink={true} />

      {/* 이미지 섹션 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="space-y-8">
              <Image
                src="/001.png"
                alt="한평생 실습신청 안내 이미지 1"
                width={800}
                height={600}
                className="mx-auto rounded-lg shadow-lg"
              />
              <Image
                src="/002.png"
                alt="한평생 실습신청 안내 이미지 2"
                width={800}
                height={600}
                className="mx-auto rounded-lg shadow-lg"
              />
              <Image
                src="/003.png"
                alt="한평생 실습신청 안내 이미지 3"
                width={800}
                height={600}
                className="mx-auto rounded-lg shadow-lg"
              />
              <Image
                src="/004.png"
                alt="한평생 실습신청 안내 이미지 4"
                width={800}
                height={600}
                className="mx-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
