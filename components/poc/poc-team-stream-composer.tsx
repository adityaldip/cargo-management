"use client";

import {
  FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import { usePocTeamStreamRoom } from "@/components/poc/poc-team-stream-room-context";
import { dispatchPocStreamActivityRefresh } from "@/lib/poc-stream-activity-refresh";
import { Button } from "@/components/ui/button";

type MentionUser = {
  id: string;
  name: string;
  email: string;
};

export function PocTeamStreamComposer() {
  const { roomId } = usePocTeamStreamRoom();
  const textareaRef =
    useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [mentionedUserIds, setMentionedUserIds] =
    useState<string[]>([]);
  const [mentionQuery, setMentionQuery] =
    useState<string | null>(null);
  const [mentionUsers, setMentionUsers] =
    useState<MentionUser[]>([]);
  const [error, setError] =
    useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isSeeding, setIsSeeding] =
    useState(false);

  const loadMentionUsers = useCallback(
    async (search: string) => {
      const response = await fetch(
        `/api/poc/team-stream/users?search=${encodeURIComponent(search)}`
      );
      const result = await response.json();

      if (!response.ok) {
        setMentionUsers([]);
        return;
      }

      setMentionUsers(result.users ?? []);
    },
    []
  );

  const handleTextChange = (
    value: string
  ) => {
    setText(value);

    const caret =
      textareaRef.current?.selectionStart ??
      value.length;
    const beforeCaret = value.slice(0, caret);
    const mentionMatch = beforeCaret.match(
      /@([^\s@]*)$/
    );

    if (mentionMatch) {
      const query = mentionMatch[1] ?? "";
      setMentionQuery(query);
      void loadMentionUsers(query);
      return;
    }

    setMentionQuery(null);
    setMentionUsers([]);
  };

  const insertMention = (user: MentionUser) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const caret = textarea.selectionStart;
    const beforeCaret = text.slice(0, caret);
    const afterCaret = text.slice(caret);
    const mentionMatch = beforeCaret.match(
      /@([^\s@]*)$/
    );

    if (!mentionMatch) {
      return;
    }

    const mentionStart =
      beforeCaret.length - mentionMatch[0].length;
    const mentionLabel = `@${user.name} `;
    const nextText =
      beforeCaret.slice(0, mentionStart) +
      mentionLabel +
      afterCaret;

    setText(nextText);
    setMentionQuery(null);
    setMentionUsers([]);
    setMentionedUserIds((current) =>
      current.includes(user.id)
        ? current
        : [...current, user.id]
    );

    requestAnimationFrame(() => {
      const nextCaret =
        mentionStart + mentionLabel.length;
      textarea.focus();
      textarea.setSelectionRange(
        nextCaret,
        nextCaret
      );
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmed = text.trim();

    if (!trimmed) {
      setError("Enter a message.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/poc/team-stream/messages",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            roomId,
            text: trimmed,
            mentionedUserIds,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to send message."
        );
        return;
      }

      setText("");
      setMentionedUserIds([]);
      setMentionQuery(null);
      setMentionUsers([]);
      dispatchPocStreamActivityRefresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send message."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeed = async () => {
    setError(null);
    setIsSeeding(true);

    try {
      const response = await fetch(
        "/api/poc/team-stream/seed",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({ roomId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ||
            "Unable to add sample messages."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add sample messages."
      );
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="relative space-y-3 border-t bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <label
          htmlFor="poc-team-stream-text"
          className="text-sm font-medium text-gray-700"
        >
          New message
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="poc-team-stream-text"
            value={text}
            onChange={(event) =>
              handleTextChange(
                event.target.value
              )
            }
            rows={3}
            placeholder="Type a message… Use @ to mention someone"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-violet-200 focus:ring-2"
          />

          {mentionQuery !== null &&
          mentionUsers.length > 0 ? (
            <ul className="absolute bottom-full left-0 z-10 mb-1 max-h-40 w-full overflow-y-auto rounded-lg border bg-white py-1 shadow-lg">
              {mentionUsers.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-violet-50"
                    onClick={() =>
                      insertMention(user)
                    }
                  >
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user.email}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {mentionedUserIds.length > 0 ? (
          <p className="text-xs text-violet-700">
            Mentioning {mentionedUserIds.length}{" "}
            teammate
            {mentionedUserIds.length === 1
              ? ""
              : "s"}
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Sending..."
              : "Send message"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSeed}
            disabled={isSeeding || isSubmitting}
          >
            {isSeeding
              ? "Seeding..."
              : "Add sample messages"}
          </Button>
        </div>
      </form>
    </div>
  );
}
