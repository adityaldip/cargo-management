import "server-only";

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth-constants";
import { supabaseAdmin } from "@/lib/supabase";
const SESSION_DURATION_MS =
  1000 * 60 * 60 * 24 * 30;

export type AppUser = {
  id: string;
  email: string;
  name: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export async function upsertAppUser(input: {
  email: string;
  name: string;
}) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  const { data: existingUser, error: selectError } =
    await supabaseAdmin
      .from("app_users")
      .select("id, email, name")
      .eq("email", email)
      .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingUser) {
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin
        .from("app_users")
        .update({
          name,
          last_login_at: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select("id, email, name")
        .single();

    if (updateError) {
      throw updateError;
    }

    return updatedUser;
  }

  const { data: createdUser, error: insertError } =
    await supabaseAdmin
      .from("app_users")
      .insert({
        email,
        name,
        last_login_at: new Date().toISOString(),
      })
      .select("id, email, name")
      .single();

  if (insertError) {
    throw insertError;
  }

  return createdUser;
}

export async function createAppSession(
  userId: string
) {
  const rawToken =
    randomBytes(32).toString("hex");
  const expiresAt = getSessionExpiryDate();

  const { error } = await supabaseAdmin
    .from("app_sessions")
    .insert({
      user_id: userId,
      token_hash: hashSessionToken(rawToken),
      expires_at: expiresAt.toISOString(),
      last_used_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }

  return {
    token: rawToken,
    expiresAt,
  };
}

export async function getCurrentAppUser() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(APP_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash =
    hashSessionToken(sessionToken);

  const { data: session, error } = await supabaseAdmin
    .from("app_sessions")
    .select("id, expires_at, user_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!session) {
    return null;
  }

  if (
    new Date(session.expires_at).getTime() <=
    Date.now()
  ) {
    await revokeSessionToken(sessionToken);
    return null;
  }

  await supabaseAdmin
    .from("app_sessions")
    .update({
      last_used_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  const { data: user, error: userError } =
    await supabaseAdmin
      .from("app_users")
      .select("id, email, name")
      .eq("id", session.user_id)
      .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  return user as AppUser;
}

export async function revokeSessionToken(
  token: string
) {
  await supabaseAdmin
    .from("app_sessions")
    .delete()
    .eq("token_hash", hashSessionToken(token));
}

export function applySessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
) {
  response.cookies.set({
    name: APP_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(
  response: NextResponse
) {
  response.cookies.set({
    name: APP_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}
