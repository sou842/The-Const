import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata(
  "Notifications",
  "Private activity and updates on The Const.",
  "/notifications",
);

export default function NotificationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
