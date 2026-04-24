-- Stevens Lost & Found — Supabase schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- It is idempotent: safe to re-run.

-- ============================================================================
-- 1. Enums
-- ============================================================================
do $$ begin
  create type user_role as enum ('student', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_type as enum ('lost', 'found');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_status as enum ('open', 'potential_match', 'claimed', 'returned', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_category as enum ('electronics', 'clothing', 'id_keys', 'bags', 'books', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_pref as enum ('email', 'in_app');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('pending', 'accepted', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type claim_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('match', 'claim', 'approval', 'return', 'system');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. profiles (mirrors auth.users, holds app-level user data)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role user_role not null default 'student',
  avatar text,
  created_at timestamptz not null default now()
);

-- Trigger: whenever a new auth user is created, create a matching profile row.
-- Enforces @stevens.edu and copies name from user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  if new.email is null or position('@stevens.edu' in lower(new.email)) = 0 then
    raise exception 'Only @stevens.edu emails are allowed';
  end if;

  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, name, role)
  values (new.id, lower(new.email), display_name, 'student')
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 3. items
-- ============================================================================
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  type item_type not null,
  title text not null,
  description text not null default '',
  category item_category not null,
  location text not null,
  date timestamptz not null,
  photos text[] not null default '{}',
  status item_status not null default 'open',
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  contact_preference contact_pref not null default 'email',
  created_at timestamptz not null default now()
);

create index if not exists items_type_idx on public.items(type);
create index if not exists items_status_idx on public.items(status);
create index if not exists items_reporter_idx on public.items(reporter_id);
create index if not exists items_created_at_idx on public.items(created_at desc);

-- ============================================================================
-- 4. matches
-- ============================================================================
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  lost_item_id uuid not null references public.items(id) on delete cascade,
  found_item_id uuid not null references public.items(id) on delete cascade,
  score int not null check (score between 0 and 100),
  reason text not null default '',
  status match_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (lost_item_id, found_item_id)
);

-- Trigger: whenever a new item is inserted, generate potential matches.
create or replace function public.handle_new_item_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  match_candidate record;
  match_score int;
  match_reason text;
begin
  for match_candidate in 
    select * from public.items 
    where type != new.type 
      and category = new.category 
      and status = 'open'
  loop
    match_score := 50; -- Base score for same category
    match_reason := 'Category match. ';
    
    if match_candidate.location = new.location then
      match_score := match_score + 30;
      match_reason := match_reason || 'Same location.';
    end if;
    
    -- insert the match
    if new.type = 'lost' then
      insert into public.matches (lost_item_id, found_item_id, score, reason)
      values (new.id, match_candidate.id, match_score, trim(match_reason))
      on conflict do nothing;
    else
      insert into public.matches (lost_item_id, found_item_id, score, reason)
      values (match_candidate.id, new.id, match_score, trim(match_reason))
      on conflict do nothing;
    end if;
  end loop;
  
  return new;
end $$;

drop trigger if exists on_item_created on public.items;
create trigger on_item_created
  after insert on public.items
  for each row execute function public.handle_new_item_matches();

-- ============================================================================
-- 5. claims
-- ============================================================================
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  claimer_id uuid not null references public.profiles(id) on delete cascade,
  verification_answers jsonb not null default '{}'::jsonb,
  status claim_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists claims_item_idx on public.claims(item_id);
create index if not exists claims_claimer_idx on public.claims(claimer_id);

-- ============================================================================
-- 6. notifications
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  type notification_type not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, read);

-- ============================================================================
-- 7. Row-Level Security
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.items          enable row level security;
alter table public.matches        enable row level security;
alter table public.claims         enable row level security;
alter table public.notifications  enable row level security;

-- Helper: is current user a moderator or admin?
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

-- profiles: anyone signed in can read (for reporter names); users can update their own row.
drop policy if exists "profiles_read_all"       on public.profiles;
drop policy if exists "profiles_update_own"     on public.profiles;
drop policy if exists "profiles_moderator_any"  on public.profiles;

create policy "profiles_read_all" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_moderator_any" on public.profiles
  for update using (public.is_moderator());

-- items: anyone signed in can read; reporter can insert/update/delete own; mods can do anything.
drop policy if exists "items_read_all"     on public.items;
drop policy if exists "items_insert_own"   on public.items;
drop policy if exists "items_update_own"   on public.items;
drop policy if exists "items_delete_own"   on public.items;
drop policy if exists "items_mod_all"      on public.items;

create policy "items_read_all" on public.items
  for select using (auth.role() = 'authenticated');

create policy "items_insert_own" on public.items
  for insert with check (auth.uid() = reporter_id);

create policy "items_update_own" on public.items
  for update using (auth.uid() = reporter_id);

create policy "items_delete_own" on public.items
  for delete using (auth.uid() = reporter_id);

create policy "items_mod_all" on public.items
  for all using (public.is_moderator()) with check (public.is_moderator());

-- matches: readable by authed; only mods write.
drop policy if exists "matches_read_all" on public.matches;
drop policy if exists "matches_mod_all"  on public.matches;

create policy "matches_read_all" on public.matches
  for select using (auth.role() = 'authenticated');

create policy "matches_mod_all" on public.matches
  for all using (public.is_moderator()) with check (public.is_moderator());

-- claims: claimer can insert and read own; item owner can read claims on their item; mods see all.
drop policy if exists "claims_read_own_or_owned"  on public.claims;
drop policy if exists "claims_insert_own"         on public.claims;
drop policy if exists "claims_mod_all"            on public.claims;

create policy "claims_read_own_or_owned" on public.claims
  for select using (
    auth.uid() = claimer_id
    or exists (select 1 from public.items i where i.id = item_id and i.reporter_id = auth.uid())
    or public.is_moderator()
  );

create policy "claims_insert_own" on public.claims
  for insert with check (auth.uid() = claimer_id);

create policy "claims_mod_all" on public.claims
  for all using (public.is_moderator()) with check (public.is_moderator());

-- notifications: user sees own; user can mark own as read.
drop policy if exists "notifications_read_own"    on public.notifications;
drop policy if exists "notifications_update_own"  on public.notifications;
drop policy if exists "notifications_mod_insert"  on public.notifications;

create policy "notifications_read_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notifications_mod_insert" on public.notifications
  for insert with check (public.is_moderator() or auth.uid() = user_id);

-- ============================================================================
-- 7b. Chat: conversations + messages
-- ============================================================================
-- A conversation is a 1-on-1 thread between two users. We store the pair
-- ordered (user_a < user_b) so a unique index enforces "one thread per pair".
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  last_read_a timestamptz not null default now(),
  last_read_b timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_pair_ordered check (user_a < user_b),
  constraint conversations_pair_unique unique (user_a, user_b)
);

create index if not exists conversations_user_a_idx on public.conversations(user_a, last_message_at desc);
create index if not exists conversations_user_b_idx on public.conversations(user_b, last_message_at desc);

-- Individual chat messages. item_id is optional and used to "tag" a message
-- with the item being discussed (rendered as a clickable card in the bubble).
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  item_id uuid references public.items(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

-- Bump last_message_at on the parent conversation whenever a message is inserted.
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists "conversations_read_participant"   on public.conversations;
drop policy if exists "conversations_insert_participant" on public.conversations;
drop policy if exists "conversations_update_participant" on public.conversations;

create policy "conversations_read_participant" on public.conversations
  for select using (auth.uid() = user_a or auth.uid() = user_b);

create policy "conversations_insert_participant" on public.conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "conversations_update_participant" on public.conversations
  for update using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "messages_read_participant"   on public.messages;
drop policy if exists "messages_insert_participant" on public.messages;

create policy "messages_read_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );

create policy "messages_insert_participant" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );

-- ============================================================================
-- 8. Storage bucket for item photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

-- Anyone signed in can upload; public read (bucket is public); owner can delete.
drop policy if exists "item_photos_read"   on storage.objects;
drop policy if exists "item_photos_insert" on storage.objects;
drop policy if exists "item_photos_delete" on storage.objects;

create policy "item_photos_read" on storage.objects
  for select using (bucket_id = 'item-photos');

create policy "item_photos_insert" on storage.objects
  for insert with check (bucket_id = 'item-photos' and auth.role() = 'authenticated');

create policy "item_photos_delete" on storage.objects
  for delete using (bucket_id = 'item-photos' and auth.uid() = owner);
