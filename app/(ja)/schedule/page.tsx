import type { Metadata } from "next";
import { connection } from "next/server";
import CloudflareWebAnalytics from "../../CloudflareWebAnalytics";
import LanguagePreferenceRedirect from "../../LanguagePreferenceRedirect";
import { currentRequestTimeMs } from "../../request-time";
import SchedulePageClient from "../../SchedulePageClient";

export const metadata: Metadata = {
  title: "VAMPIR ワールドボス・ゲヘナ出現時間｜次の出現をJST表示",
  description: "VAMPIRのワールドボスとゲヘナの次の出現予定、定例のJST時刻、参加レベルを確認できます。実際の時刻はゲーム内時刻表と公式告知を優先してください。",
  alternates: { canonical: "/schedule", languages: { ja: "/schedule", en: "/en/schedule" } },
  openGraph: {
    type: "website",
    url: "/schedule",
    locale: "ja_JP",
    alternateLocale: ["en_US"],
    title: "VAMPIR ワールドボス・ゲヘナ出現時間",
    description: "次の出現予定と、ワールドボス・ゲヘナの定例JST時刻を確認できます。",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "VAMPIR ワールドボス・ゲヘナ出現時間",
    description: "次の出現予定と、ワールドボス・ゲヘナの定例JST時刻を確認できます。",
    images: [],
  },
};

export default async function SchedulePage() {
  await connection();
  const initialNowMs = currentRequestTimeMs();
  return <><LanguagePreferenceRedirect page="schedule" /><SchedulePageClient locale="ja" initialNowMs={initialNowMs} /><CloudflareWebAnalytics /></>;
}
