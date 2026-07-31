import type { Metadata, Viewport } from "next";
import { RootBody } from "../RootLayoutParts";
import "../globals.css";

const SITE_URL = "https://vampir.cilabworks.com";

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VAMPIR Daily Navigator | Tasks and Spawn Timer",
  description:
    "Check upcoming VAMPIR spawns, today's priorities, and daily and weekly routines. Includes level-based filtering and device-local checklists.",
  applicationName: "VAMPIR Daily Navigator",
  alternates: {
    canonical: "/en",
    languages: { ja: "/", en: "/en" },
  },
  manifest: "/manifest-en.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VAMPIR Daily Navigator",
  },
  openGraph: {
    type: "website",
    url: "/en",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    title: "VAMPIR Daily Navigator",
    description: "See the next spawn and what to do today at a glance.",
  },
  twitter: {
    card: "summary",
    title: "VAMPIR Daily Navigator",
    description: "See the next spawn and what to do today at a glance.",
  },
  icons: {
    icon: "/favicon.png?v=20260730-1",
    shortcut: "/favicon.png?v=20260730-1",
    apple: "/icon-192.png",
  },
};

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><RootBody>{children}</RootBody></html>;
}
