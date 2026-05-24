import { createClient } from "@liveblocks/client";

export const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

export const triggerActivity = async ({
  title,
  description,
  type,
  subjectId,
}: {
  title: string;
  description: string;
  type: string;
  subjectId: string;
}) => {
  await fetch("/api/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description,
      type,
      subjectId,
    }),
  });
};