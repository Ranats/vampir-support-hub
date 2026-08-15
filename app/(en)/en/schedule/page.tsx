import type { Metadata } from "next";
import { connection } from "next/server";
import CloudflareWebAnalytics from "../../../CloudflareWebAnalytics";
import { currentRequestTimeMs } from "../../../request-time";
import SchedulePageClient from "../../../SchedulePageClient";

export const metadata: Metadata = {
  title: "VAMPIR World Boss and Gehenna Schedule | Next Spawn in JST",
  description: "See the next listed VAMPIR World Boss and Gehenna spawn, regular JST times, and level requirements. Always follow the in-game schedule and official notices.",
  alternates: { canonical: "/en/schedule", languages: { ja: "/schedule", en: "/en/schedule" } },
  openGraph: {
    type: "website",
    url: "/en/schedule",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    title: "VAMPIR World Boss and Gehenna Schedule",
    description: "See the next listed spawn and the regular World Boss and Gehenna timetable in JST.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "VAMPIR World Boss and Gehenna Schedule",
    description: "See the next listed spawn and the regular World Boss and Gehenna timetable in JST.",
    images: [],
  },
};

export default async function EnglishSchedulePage() {
  await connection();
  return <><SchedulePageClient locale="en" initialNowMs={currentRequestTimeMs()} /><CloudflareWebAnalytics /></>;
}
