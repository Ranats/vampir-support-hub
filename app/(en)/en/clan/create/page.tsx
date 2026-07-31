import type { Metadata } from "next";
import ClanPortalCreateClient from "../../../../ClanPortalCreateClient";

export const metadata: Metadata = {
  title: "Create a shared clan portal | VAMPIR Daily Navigator",
  description: "Create a dedicated portal for a clan administrator to share scheduled weekdays and times.",
  robots: { index: false, follow: false },
};

export default function ClanPortalCreatePage() {
  return <ClanPortalCreateClient locale="en" />;
}
