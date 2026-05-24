create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  liveblocks_room_id text not null,
  author_user_id uuid not null references public.app_users(id) on delete cascade,
  title text not null default 'Untitled post',
  body_preview text not null default '',
  body_plain_text text not null default '',
  hashtags text[] not null default '{}',
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop index if exists public.feed_posts_liveblocks_room_id_key;
alter table public.feed_posts
  drop constraint if exists feed_posts_liveblocks_room_id_key;

create index if not exists feed_posts_author_user_id_idx
  on public.feed_posts (author_user_id);

create index if not exists feed_posts_created_at_idx
  on public.feed_posts (created_at desc);

create index if not exists feed_posts_hashtags_idx
  on public.feed_posts using gin (hashtags);

create table if not exists public.feed_post_reactions (
  id uuid primary key default gen_random_uuid(),
  feed_post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists feed_post_reactions_unique_idx
  on public.feed_post_reactions (feed_post_id, user_id, emoji);

create index if not exists feed_post_reactions_post_id_idx
  on public.feed_post_reactions (feed_post_id);

drop trigger if exists set_feed_posts_updated_at on public.feed_posts;

create trigger set_feed_posts_updated_at
before update on public.feed_posts
for each row
execute function public.set_timestamp_updated_at();

alter table public.feed_posts enable row level security;
alter table public.feed_post_reactions enable row level security;
