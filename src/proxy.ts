import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "THECONST");
const COOKIE_NAME = "tc_session";

// Define route categories
const PUBLIC_FILE_EXTENSIONS = [".ico", ".png", ".jpg", ".jpeg", ".svg", ".css", ".js"];
const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = [
  "/write",
  "/saved",
  "/settings",
  "/messages",
  "/network",
  "/notifications",
  "/admin",
  "/profile",
];

export async function proxy(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const path = nextUrl.pathname;

  // 1. Skip proxy for static assets
  if (PUBLIC_FILE_EXTENSIONS.some((ext) => path.endsWith(ext))) {
    return NextResponse.next();
  }

  // 2. Get session token from cookies
  const token = cookies.get(COOKIE_NAME)?.value;

  // 3. Verify session if token exists
  let session: JWTPayload | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload;
    } catch {
      // Invalid token, treat as unauthenticated
      session = null;
    }
  }

  const isAuthenticated = !!session;

  // 4. Handle Auth Routes (Login/Register)
  if (AUTH_ROUTES.some((route) => path.startsWith(route))) {
    if (isAuthenticated) {
      console.log(`[Proxy] Redirecting authenticated user away from ${path}`);
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 5. Handle Protected Routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => {
    return path === route || path.startsWith(`${route}/`);
  });

  const isPublicProfile = path.startsWith("/profile/") && path !== "/profile";
  
  if (isProtectedRoute && !isPublicProfile) {
    console.log(`[Proxy] Checking access for ${path}, status: ${isAuthenticated ? 'Authenticated' : 'Unauthenticated'}`);
    
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based protection for /admin
    if (path.startsWith("/admin") && session?.role !== "admin") {
      console.log(`[Proxy] Denied access to admin route for user ${session?.email}`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
