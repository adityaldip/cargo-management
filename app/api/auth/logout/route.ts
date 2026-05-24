import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth-constants";
import {
  clearSessionCookie,
  revokeSessionToken,
} from "@/lib/app-auth";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(APP_SESSION_COOKIE)?.value;

  if (sessionToken) {
    await revokeSessionToken(sessionToken);
  }

  const response = NextResponse.json({
    success: true,
  });

  clearSessionCookie(response);

  return response;
}
