import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata(
  "Saved Posts",
  "Your saved content on The Const.",
  "/saved",
);

export default function SavedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
