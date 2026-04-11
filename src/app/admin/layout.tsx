import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";
import { AdminLayout as AdminLayoutWrapper } from "@/components/admin/AdminLayout";

export const metadata: Metadata = createNoIndexMetadata(
  "Admin",
  "Administrative tools for The Const.",
  "/admin",
);

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
