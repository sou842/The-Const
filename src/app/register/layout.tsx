import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata(
  "Create Account",
  "Create a The Const account.",
  "/register",
);

export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
