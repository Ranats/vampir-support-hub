import { connection } from "next/server";
import CloudflareWebAnalytics from "../CloudflareWebAnalytics";
import HomeClient from "../HomeClient";
import LanguagePreferenceRedirect from "../LanguagePreferenceRedirect";
import { currentRequestTimeMs } from "../request-time";

export default async function Home() {
  await connection();
  const initialNowMs = currentRequestTimeMs();

  return (
    <>
      <LanguagePreferenceRedirect page="home" />
      <HomeClient locale="ja" initialNowMs={initialNowMs} />
      <CloudflareWebAnalytics />
    </>
  );
}
