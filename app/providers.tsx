"use client";

import { LiveblocksProvider } from "@liveblocks/react";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={async ({ userIds }) => {
        if (userIds.length === 0) {
          return [];
        }

        const response = await fetch(
          `/api/app-users?ids=${encodeURIComponent(userIds.join(","))}`
        );

        if (!response.ok) {
          return userIds.map(() => undefined);
        }

        const result = await response.json();
        const byId = new Map(
          (result.users ?? []).map(
            (user: {
              id: string;
              name: string;
              email: string;
            }) => [
              user.id,
              {
                name: user.name,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=111827&color=ffffff`,
              },
            ]
          )
        );

        return userIds.map((id) => byId.get(id));
      }}
      resolveMentionSuggestions={async ({ text }) => {
        const response = await fetch(
          `/api/app-users?search=${encodeURIComponent(text)}`
        );

        if (!response.ok) {
          return [];
        }

        const result = await response.json();

        return (result.users ?? []).map(
          (user: { id: string }) => user.id
        );
      }}
    >
      {children}
    </LiveblocksProvider>
  );
}
