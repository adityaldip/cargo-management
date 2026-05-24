import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest
) {
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
  const idsParam =
    searchParams.get("ids");
  const search =
    searchParams.get("search")?.trim() ?? "";

  let query = supabaseAdmin
    .from("app_users")
    .select("id, name, email")
    .order("name", {
      ascending: true,
    });

  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    query = query.in("id", ids);
  } else if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query.limit(20);

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
