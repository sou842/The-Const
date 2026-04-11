import type { Metadata } from "next";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata(
  "Your Profile",
  "Manage your profile on The Const.",
  "/profile",
);

export default function Profile() {
  return <ProfilePageClient />;
}
