import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { signJWT, createSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import { GOOGLE_TOKEN_URL, GOOGLE_USER_INFO_URL } from "@/lib/constants";
 

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // Get user info
    const userInfoResponse = await fetch(GOOGLE_USER_INFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    // Connect to DB and find/create user
    await connectDB();

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        profilePhoto: googleUser.picture,
        oauthProvider: "google",
        oauthId: googleUser.id,
        emailVerified: googleUser.verified_email,
        role: "creator",
        status: "active",
      });
    } else if (!user.oauthProvider) {
      // Link OAuth to existing account
      user.oauthProvider = "google";
      user.oauthId = googleUser.id;
      user.emailVerified = googleUser.verified_email;
      if (!user.profilePhoto) user.profilePhoto = googleUser.picture;
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
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}