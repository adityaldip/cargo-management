"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { PocTeamStreamLayout } from "@/components/poc/poc-team-stream-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dispatchPocStreamActivityRefresh } from "@/lib/poc-stream-activity-refresh";

export type PocStreamRoom = {
  id: string;
  title: string;
  description: string;
  label: string;
  lastConnectionAt?: string;
};

export function PocTeamStreamRoomsHub() {
  const router = useRouter();
  const [rooms, setRooms] = useState<PocStreamRoom[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [error, setError] =
    useState<string | null>(null);
  const [isCreating, setIsCreating] =
    useState(false);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/poc/team-stream/rooms"
      );
      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "Unable to load rooms."
        );
        return;
      }

      setRooms(result.rooms ?? []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load rooms."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const handleCreateRoom = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Enter a title.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/poc/team-stream/rooms",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            description: description.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to create room."
        );
        return;
      }

      const room = result.room as PocStreamRoom;

      if (!room?.id) {
        setError("Invalid room response.");
        return;
      }

      setTitle("");
      setDescription("");
      dispatchPocStreamActivityRefresh();
      router.push(
        `/poc/team-stream/${encodeURIComponent(room.id)}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create room."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <PocTeamStreamLayout>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border bg-white p-4 shadow-sm">
        <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
            Proof of concept
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            Stream rooms
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a stream with a title and
            description, then open it for team chat.
          </p>
        </div>

        <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Create a new stream
          </h2>
          <form
            onSubmit={handleCreateRoom}
            className="mt-3 space-y-3"
          >
            <div className="space-y-1">
              <label
                htmlFor="poc-room-title"
                className="text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <Input
                id="poc-room-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Q2 launch updates"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="poc-room-description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="poc-room-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={3}
                placeholder="What is this stream for?"
                disabled={isCreating}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-200 focus:ring-2"
              />
            </div>
            <Button
              type="submit"
              disabled={isCreating}
            >
              {isCreating
                ? "Creating..."
                : "Create & open"}
            </Button>
          </form>
          {error ? (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Your streams
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rooms...
            </div>
          ) : rooms.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              No streams yet. Create one above.
            </p>
          ) : (
            <ul className="divide-y">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex items-start justify-between gap-4 px-4 py-4 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">
                      {room.title}
                    </p>
                    {room.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {room.description}
                      </p>
                    ) : null}
                    <p className="mt-2 truncate text-xs text-gray-400">
                      {room.id}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Link
                      href={`/poc/team-stream/${encodeURIComponent(room.id)}`}
                    >
                      Open chat
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PocTeamStreamLayout>
  );
}
