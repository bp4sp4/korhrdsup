import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "한평생실습지원",
  description:
    "실습신청을 간편하게! 한평생실습지원센터에서 안전하고 신뢰할 수 있는 실습 환경을 제공합니다.",
  openGraph: {
    title: "한평생실습지원",
    description:
      "실습신청을 간편하게! 한평생실습지원센터에서 안전하고 신뢰할 수 있는 실습 환경을 제공합니다.",
    images: [
      {
        url: "https://korhrdsup.vercel.app/ogimage.png",
        width: 800,
        height: 600,
        alt: "한평생실습지원센터 로고",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "한평생실습지원",
    description:
      "실습신청을 간편하게! 한평생실습지원센터에서 안전하고 신뢰할 수 있는 실습 환경을 제공합니다.",
    images: ["https://korhrdsup.vercel.app/ogimage.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
