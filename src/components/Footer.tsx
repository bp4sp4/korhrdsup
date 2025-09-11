export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo_footer.png"
              alt="한평생실습지원센터 로고"
              width={100}
              height={60}
              className="h-6 sm:h-6 w-auto object-contain"
            />
          </div>

          <p className="text-gray-500 text-sm">
            &copy; 2025 한평생실습지원. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
