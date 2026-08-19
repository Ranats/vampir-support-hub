import type { Metadata } from "next";
import { connection } from "next/server";
import CloudflareWebAnalytics from "../../CloudflareWebAnalytics";
import LanguagePreferenceRedirect from "../../LanguagePreferenceRedirect";
import { currentRequestTimeMs } from "../../request-time";
import SchedulePageClient from "../../SchedulePageClient";

export const metadata: Metadata = {
  title: "VAMPIR イベントボス・ワールドボス・ゲヘナ出現時間",
  description: "VAMPIRのイベントボス、ワールドボス、ゲヘナの次の出現予定を確認。イベントボスは日本・韓国と台湾・香港・マカオの地域別時刻に対応しています。",
  alternates: { canonical: "/schedule", languages: { ja: "/schedule", en: "/en/schedule" } },
  openGraph: {
    type: "website",
    url: "/schedule",
    locale: "ja_JP",
    alternateLocale: ["en_US"],
    title: "VAMPIR イベントボス・ワールドボス・ゲヘナ出現時間",
    description: "イベントボスの地域別時刻と、ワールドボス・ゲヘナの次の出現予定を確認できます。",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "VAMPIR イベントボス・ワールドボス・ゲヘナ出現時間",
    description: "イベントボスの地域別時刻と、ワールドボス・ゲヘナの次の出現予定を確認できます。",
    images: [],
  },
};

export default async function SchedulePage() {
  await connection();
  const initialNowMs = currentRequestTimeMs();
  return <><LanguagePreferenceRedirect page="schedule" /><SchedulePageClient locale="ja" initialNowMs={initialNowMs} /><CloudflareWebAnalytics /></>;
}
