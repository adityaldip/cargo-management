# Team stream POC (Liveblocks Feeds)

Standalone proof of concept for [Liveblocks Feeds](https://liveblocks.io/docs/get-started/nextjs-feeds). It does **not** use `/feeds` or Supabase `feed_posts`.

## Enable

```bash
LIVEBLOCKS_POC_TEAM_STREAM_ENABLED=true
```

Also requires `LIVEBLOCKS_SECRET_KEY` and the existing `/api/liveblocks-auth` setup.

## Open

1. **Rooms:** `/poc/team-stream` — create or pick a room (no chat here)
2. **Chat:** `/poc/team-stream/{roomId}` — messages for that room only
3. Sidebar: **Team stream POC** (flask icon)

## What it proves

- `createFeed` + `createFeedMessage` on the server
- `useFeedMessages` for realtime UI
- Dashboard metric **Feed messages added** increases when you send messages

## Rooms

- **Default room:** `poc-team-stream-room` (label: General)
- **Create a room:** on `/poc/team-stream` → enter **Title** + **Description** → **Create & open** → `POST /api/poc/team-stream/rooms` with `{ "title", "description" }` → opens `/poc/team-stream/poc-stream-{slug}`
- **Open chat:** click **Open chat** on a room (separate page from the rooms list)

## Room / feed ids

| Resource | Id pattern |
|----------|------------|
| Room | `poc-team-stream-room` or `poc-stream-{slug}` |
| Feed (per room) | `poc-team-stream` |

## Stream messages vs comments

| | Technology |
|--|--|
| **Stream message** (main timeline) | Liveblocks **Feeds** (`createFeedMessage`) |
| **Comment** (under a message) | Liveblocks **Comments** (`Thread` + `Composer`) |

Open **Comments** on a message to reply. Comments are not feed messages — they use thread metadata `streamMessageId`.

## Mentions

- **Posts:** type `@` in the stream composer
- **Comments:** use `@` in the Liveblocks comment composer (built-in)
- Post mentions use `$poc_mention` custom inbox (register in dashboard if needed)

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/poc/team-stream/rooms` | List stream rooms |
| `POST` | `/api/poc/team-stream/rooms` | Body: `{ "title", "description?" }` — create room |
| `GET` | `/api/poc/team-stream/users?search=` | Mention autocomplete |
| `GET` | `/api/poc/team-stream/messages?roomId=` | List messages |
| `POST` | `/api/poc/team-stream/messages` | Body: `{ "roomId", "text", "mentionedUserIds" }` |
| `POST` | `/api/poc/team-stream/seed` | Body: `{ "roomId" }` — sample messages |

## 5-minute demo

1. Set `LIVEBLOCKS_POC_TEAM_STREAM_ENABLED=true` and restart the app.
2. Open `/poc/team-stream` in two browsers (two users).
3. Click **Add sample messages** or send a custom message.
4. Confirm both browsers update without refresh.
5. Check Liveblocks dashboard → **Feed messages added**.

## Decoupled from workspace feed

The workspace feed at `/feeds` is unchanged. No publish hook and no purple panel on the feed activity sidebar.
