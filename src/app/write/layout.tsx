import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata(
  "Write",
  "Create or edit content on The Const.",
  "/write",
);

export default function WriteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
