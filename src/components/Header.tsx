import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  showHomeLink?: boolean;
  homeLinkText?: string;
  rightContent?: React.ReactNode;
}

export default function Header({
  showHomeLink = true,
  homeLinkText = "홈으로 돌아가기",
  rightContent,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="한평생실습지원센터 로고"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav className="flex items-center ml-4 md:ml-8">
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 text-sm md:text-base"
            >
              자세히 알아보기
            </Link>
          </nav>

          <div className="flex items-center ml-auto">
            {rightContent ||
              (showHomeLink && (
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {homeLinkText}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
