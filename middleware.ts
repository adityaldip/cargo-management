import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = new Set([
  "/login",
]);

function isPublicRoute(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/api/auth")) {
    return true;
  }

  if (pathname.startsWith("/_next")) {
    return true;
  }

  return pathname === "/favicon.ico";
}

export function middleware(
  request: NextRequest
) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get(APP_SESSION_COOKIE)
      ?.value;

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL(
      "/login",
      request.url
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
