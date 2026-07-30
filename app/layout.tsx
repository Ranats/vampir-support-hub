import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegistration from "./PwaRegistration";
import "./globals.css";

const SITE_URL = "https://vampir.cilabworks.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VAMPIR 日課ナビ｜今日やること・出現タイマー",
  description:
    "VAMPIRの次の出現、今日やること、日課・週課をシンプルに確認。レベルに合わせたタイマーと端末内チェックに対応しています。",
  applicationName: "VAMPIR 日課ナビ",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VAMPIR 日課ナビ",
  },
  openGraph: {
    type: "website",
    url: "/",
    locale: "ja_JP",
    title: "VAMPIR 日課ナビ",
    description: "次の出現と、今日やることをひと目で確認。",
    images: [
      {
        url: "/og.png?v=20260730-2",
        width: 1200,
        height: 630,
        alt: "VAMPIR 日課ナビ — 次の出現と、今日やること。",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VAMPIR 日課ナビ",
    description: "次の出現と、今日やることをひと目で確認。",
    images: ["/og.png?v=20260730-2"],
  },
  icons: {
    icon: "/favicon.png?v=20260730-1",
    shortcut: "/favicon.png?v=20260730-1",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
