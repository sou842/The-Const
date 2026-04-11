import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata(
  "Network",
  "Manage your professional network on The Const.",
  "/network",
);

export default function NetworkLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
