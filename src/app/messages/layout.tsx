import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata(
  "Messages",
  "Private conversations on The Const.",
  "/messages",
);

export default function MessagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
