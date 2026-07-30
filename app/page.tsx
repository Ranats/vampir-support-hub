import { connection } from "next/server";
import HomeClient from "./HomeClient";
import { currentRequestTimeMs } from "./request-time";

export default async function Home() {
  await connection();
  return <HomeClient initialNowMs={currentRequestTimeMs()} />;
}
