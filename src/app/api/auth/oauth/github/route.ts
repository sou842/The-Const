import { NextRequest, NextResponse } from "next/server";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";

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