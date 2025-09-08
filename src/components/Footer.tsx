import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="한평생실습지원센터 로고"
                width={24}
                height={24}
                className="rounded-lg"
              />
            </div>
            <h3 className="ml-3 text-xl font-bold">한평생실습지원</h3>
          </div>

          <p className="text-gray-500 text-sm">
            &copy; 2025 한평생실습지원. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
