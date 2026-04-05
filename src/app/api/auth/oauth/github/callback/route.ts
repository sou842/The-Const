import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { signJWT, createSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { GITHUB_EMAIL_URL, GITHUB_TOKEN_URL, GITHUB_USER_URL } from "@/lib/constants";



export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/github/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // Get user info
    const [userResponse, emailsResponse] = await Promise.all([
      fetch(GITHUB_USER_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }),
      fetch(GITHUB_EMAIL_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }),
    ]);

    const githubUser = await userResponse.json();
    const emails = await emailsResponse.json();

    const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email;

    if (!primaryEmail) {
      throw new Error("No email found in GitHub account");
    }

    // Connect to DB and find/create user
    await connectDB();

    let user = await User.findOne({ email: primaryEmail });

    if (!user) {
      user = await User.create({
        name: githubUser.name || githubUser.login,
        email: primaryEmail,
        profilePhoto: githubUser.avatar_url,
        oauthProvider: "github",
        oauthId: githubUser.id.toString(),
        emailVerified: emails.find((e: any) => e.primary)?.verified || false,
        role: "creator",
        status: "active",
        socialLinks: {
          github: githubUser.html_url,
        },
      });
    } else if (!user.oauthProvider) {
      user.oauthProvider = "github";
      user.oauthId = githubUser.id.toString();
      user.emailVerified = emails.find((e: any) => e.primary)?.verified || false;
      if (!user.profilePhoto) user.profilePhoto = githubUser.avatar_url;
      if (!user.socialLinks?.github) {
        user.socialLinks = { ...user.socialLinks, github: githubUser.html_url };
      }
      await user.save();
    }

    // Create session
    const token = await signJWT({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const cookieStore = await cookies();
    const sessionCookie = createSessionCookie(token);
    cookieStore.set(sessionCookie);

    return NextResponse.redirect(new URL(state, req.url));
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}