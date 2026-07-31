import { connection } from "next/server";
import HomeClient from "../../HomeClient";
import { currentRequestTimeMs } from "../../request-time";

export default async function EnglishHome() {
  await connection();
  const initialNowMs = currentRequestTimeMs();

  return <HomeClient locale="en" initialNowMs={initialNowMs} />;
}
