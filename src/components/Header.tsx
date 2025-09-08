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
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="한평생실습지원센터 로고"
                width={20}
                height={20}
                className="rounded-lg"
              />
            </div>
            <h1 className="ml-2 text-xl font-bold text-gray-900">
              한평생실습지원
            </h1>
          </Link>

          <div className="flex items-center">
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
