import Link from "next/link";
import { redirect } from "next/navigation";

import { PocTeamStreamRoomsHub } from "@/components/poc/poc-team-stream-rooms-hub";
import { getCurrentAppUser } from "@/lib/app-auth";
import { isPocTeamStreamEnabled } from "@/lib/poc-team-stream";

export default async function TeamStreamPocPage() {
  const currentUser =
    await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!isPocTeamStreamEnabled()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md rounded-2xl border p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Team stream POC is disabled
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Set{" "}
            <code className="rounded bg-gray-100 px-1">
              LIVEBLOCKS_POC_TEAM_STREAM_ENABLED=true
            </code>{" "}
            in your environment to enable this
            experiment.
          </p>
          <Link
            href="/feeds"
            className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline"
          >
            Back to workspace feed
          </Link>
        </div>
      </div>
    );
  }

  return <PocTeamStreamRoomsHub />;
}
