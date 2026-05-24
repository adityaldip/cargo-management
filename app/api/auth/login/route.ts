import { NextRequest, NextResponse } from "next/server";

import {
  applySessionCookie,
  createAppSession,
  normalizeEmail,
  upsertAppUser,
} from "@/lib/app-auth";

export async function POST(
  request: NextRequest
) {
  const body = await request.json();
  const name = body?.name?.trim();
  const email = normalizeEmail(
    body?.email ?? ""
  );

  if (!name || !email) {
    return NextResponse.json(
      {
        error: "Name and email are required.",
      },
      { status: 400 }
    );
  }

  const user = await upsertAppUser({
    name,
    email,
  });
  const session = await createAppSession(
    user.id
  );

  const response = NextResponse.json({
    user,
  });

  applySessionCookie(
    response,
    session.token,
    session.expiresAt
  );

  return response;
}
