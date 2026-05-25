import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { isPocTeamStreamEnabled } from "@/lib/poc-team-stream";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest
) {
  if (!isPocTeamStreamEnabled()) {
    return NextResponse.json(
      { error: "Team stream POC is disabled." },
      { status: 404 }
    );
  }

  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(
    request.url
  );
  const search =
    searchParams.get("search")?.trim() ?? "";

  let query = supabaseAdmin
    .from("app_users")
    .select("id, name, email")
    .order("name", { ascending: true });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query.limit(12);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    users: data ?? [],
  });
}
