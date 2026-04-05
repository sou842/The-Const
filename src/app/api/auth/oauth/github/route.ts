import { GITHUB_AUTH_URL } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/github/callback`,
    scope: "read:user user:email",
    state: callbackUrl,
  });

  return NextResponse.redirect(`${GITHUB_AUTH_URL}?${params.toString()}`);
}