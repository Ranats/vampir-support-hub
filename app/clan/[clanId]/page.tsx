import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isClanPortalId } from "../../clan-portal";
import { currentRequestTimeMs } from "../../request-time";
import ClanPortalClient from "./ClanPortalClient";

export const metadata: Metadata = {
  title: "クラン共有ポータル｜VAMPIR 日課ナビ",
  description: "クランメンバー向けの開催予定を確認します。",
  robots: { index: false, follow: false },
};

export default async function ClanPortalPage({
  params,
}: {
  params: Promise<{ clanId: string }>;
}) {
  await connection();
  const { clanId } = await params;
  if (!isClanPortalId(clanId)) notFound();
  return <ClanPortalClient clanId={clanId} initialNowMs={currentRequestTimeMs()} />;
}
