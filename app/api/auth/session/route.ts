import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";

export async function GET() {
  const user = await getCurrentAppUser();

  return NextResponse.json({
    user,
  });
}
