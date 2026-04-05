import { GOOGLE_AUTH_URL } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";



export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: callbackUrl, // Pass callback URL through state
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}