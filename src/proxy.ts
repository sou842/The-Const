import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

const protectedRoutes = ["/write"];
const adminRoutes = ["/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (isProtected || isAdmin) {
    const session = await getSessionFromRequest(req);
    console.log(`[Proxy] Path: ${pathname}, Status: ${session ? 'Logged in' : 'Logged out'}, Role: ${session?.role}`);

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isAdmin && session.role !== "admin") {
      console.log(`[Proxy] Denied access to admin route for role: ${session.role}`);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/write", "/admin", "/admin/:path*"],
};
