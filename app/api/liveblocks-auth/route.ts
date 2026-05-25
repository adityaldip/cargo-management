import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/app-auth";
import { pickLiveblocksUserColor } from "@/lib/liveblocks-user-color";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST() {
  const user = await getCurrentAppUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const session = liveblocks.prepareSession(
    user.id,
    {
      userInfo: {
        name: user.name,
        email: user.email,
        color: pickLiveblocksUserColor(user.id),
      },
    }
  );

  session.allow("*", session.FULL_ACCESS);

  const { body, status } = await session.authorize();

  return new NextResponse(body, { status });
}
