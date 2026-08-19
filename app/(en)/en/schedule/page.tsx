import type { Metadata } from "next";
import { connection } from "next/server";
import CloudflareWebAnalytics from "../../../CloudflareWebAnalytics";
import { currentRequestTimeMs } from "../../../request-time";
import SchedulePageClient from "../../../SchedulePageClient";

export const metadata: Metadata = {
  title: "VAMPIR Event Boss, World Boss and Gehenna Schedule",
  description: "See upcoming VAMPIR Event Boss, World Boss, and Gehenna spawns, including confirmed Event Boss times for Japan/Korea and Taiwan/Hong Kong/Macau.",
  alternates: { canonical: "/en/schedule", languages: { ja: "/schedule", en: "/en/schedule" } },
  openGraph: {
    type: "website",
    url: "/en/schedule",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    title: "VAMPIR Event Boss, World Boss and Gehenna Schedule",
    description: "See regional Event Boss times and upcoming World Boss and Gehenna spawns.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "VAMPIR Event Boss, World Boss and Gehenna Schedule",
    description: "See regional Event Boss times and upcoming World Boss and Gehenna spawns.",
    images: [],
  },
};

export default async function EnglishSchedulePage() {
  await connection();
  return <><SchedulePageClient locale="en" initialNowMs={currentRequestTimeMs()} /><CloudflareWebAnalytics /></>;
}
