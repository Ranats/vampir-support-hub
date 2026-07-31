import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isClanPortalId } from "../../../../clan-portal";
import ClanPortalClient from "../../../../ClanPortalClient";
import { currentRequestTimeMs } from "../../../../request-time";

export const metadata: Metadata = {
  title: "Shared clan portal | VAMPIR Daily Navigator",
  description: "View the schedule shared with clan members.",
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
  return <ClanPortalClient clanId={clanId} initialNowMs={currentRequestTimeMs()} locale="en" />;
}
