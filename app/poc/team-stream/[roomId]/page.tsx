import Link from "next/link";
import { redirect } from "next/navigation";

import { PocTeamStreamChatPage } from "@/components/poc/poc-team-stream-chat-page";
import { getCurrentAppUser } from "@/lib/app-auth";
import {
  getPocStreamRoom,
  isPocStreamRoomId,
  isPocTeamStreamEnabled,
} from "@/lib/poc-team-stream";

export default async function TeamStreamRoomChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!isPocTeamStreamEnabled()) {
    redirect("/poc/team-stream");
  }

  const { roomId: rawRoomId } = await params;
  const roomId = decodeURIComponent(
    rawRoomId ?? ""
  ).trim();

  if (!isPocStreamRoomId(roomId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md rounded-2xl border p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Unknown room
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This stream room does not exist or is
            invalid.
          </p>
          <Link
            href="/poc/team-stream"
            className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline"
          >
            Back to rooms
          </Link>
        </div>
      </div>
    );
  }

  const room = await getPocStreamRoom(roomId);

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md rounded-2xl border p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Unknown room
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This stream room could not be loaded.
          </p>
          <Link
            href="/poc/team-stream"
            className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline"
          >
            Back to rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PocTeamStreamChatPage
      roomId={room.id}
      roomTitle={room.title}
      roomDescription={room.description}
    />
  );
}
