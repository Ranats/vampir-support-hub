import type { Metadata } from "next";
import ClanPortalCreateClient from "./ClanPortalCreateClient";

export const metadata: Metadata = {
  title: "クラン共有ポータルを作成｜VAMPIR 日課ナビ",
  description: "クラン管理者が開催曜日と時刻を共有するための専用ポータルを作成します。",
  robots: { index: false, follow: false },
};

export default function ClanPortalCreatePage() {
  return <ClanPortalCreateClient />;
}
