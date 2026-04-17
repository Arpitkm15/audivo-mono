-- Supabase schema for auth + liked songs + user playlists
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    display_name text,
    avatar_url text,
    banner text,
    status text,
    about text,
    website text,
    lastfm_username text,
    privacy jsonb default '{"playlists":"public","lastfm":"public"}'::jsonb,
    library jsonb default '{}'::jsonb,
    history jsonb default '[]'::jsonb,
    user_playlists jsonb default '{}'::jsonb,
    user_folders jsonb default '{}'::jsonb,
    favorite_albums jsonb default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists username text,
    add column if not exists display_name text,
    add column if not exists avatar_url text,
    add column if not exists banner text,
    add column if not exists status text,
    add column if not exists about text,
    add column if not exists website text,
    add column if not exists lastfm_username text,
    add column if not exists privacy jsonb default '{"playlists":"public","lastfm":"public"}'::jsonb,
    add column if not exists library jsonb default '{}'::jsonb,
    add column if not exists history jsonb default '[]'::jsonb,
    add column if not exists user_playlists jsonb default '{}'::jsonb,
    add column if not exists user_folders jsonb default '{}'::jsonb,
    add column if not exists favorite_albums jsonb default '[]'::jsonb,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
    alter column privacy set default '{"playlists":"public","lastfm":"public"}'::jsonb,
    alter column library set default '{}'::jsonb,
    alter column history set default '[]'::jsonb,
    alter column user_playlists set default '{}'::jsonb,
    alter column user_folders set default '{}'::jsonb,
    alter column favorite_albums set default '[]'::jsonb,
    alter column created_at set default now(),
    alter column updated_at set default now();

create table if not exists public.user_liked_songs (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    track_id text not null,
    track_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, track_id)
);

create table if not exists public.user_playlists (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    playlist_id text not null,
    name text not null,
    description text default '',
    cover text,
    tracks jsonb not null default '[]'::jsonb,
    images jsonb not null default '[]'::jsonb,
    is_public boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, playlist_id)
);

create table if not exists public.public_playlists (
    id uuid primary key default gen_random_uuid(),
    uuid text not null unique,
    uid uuid not null references auth.users(id) on delete cascade,
    title text,
    name text,
    playlist_name text,
    image text,
    cover text,
    playlist_cover text,
    description text,
    tracks jsonb not null default '[]'::jsonb,
    is_public boolean not null default true,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_liked_songs_updated_at on public.user_liked_songs;
create trigger trg_user_liked_songs_updated_at
before update on public.user_liked_songs
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_playlists_updated_at on public.user_playlists;
create trigger trg_user_playlists_updated_at
before update on public.user_playlists
for each row execute function public.set_updated_at();

drop trigger if exists trg_public_playlists_updated_at on public.public_playlists;
create trigger trg_public_playlists_updated_at
before update on public.public_playlists
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_liked_songs enable row level security;
alter table public.user_playlists enable row level security;
alter table public.public_playlists enable row level security;

-- Profiles policies
drop policy if exists profiles_select_own_or_public on public.profiles;
create policy profiles_select_own_or_public
on public.profiles
for select
using (auth.uid() = id or coalesce((privacy->>'playlists') = 'public', true));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
on public.profiles
for delete
using (auth.uid() = id);

-- Liked songs policies
drop policy if exists liked_songs_select_own on public.user_liked_songs;
create policy liked_songs_select_own
on public.user_liked_songs
for select
using (auth.uid() = user_id);

drop policy if exists liked_songs_insert_own on public.user_liked_songs;
create policy liked_songs_insert_own
on public.user_liked_songs
for insert
with check (auth.uid() = user_id);

drop policy if exists liked_songs_update_own on public.user_liked_songs;
create policy liked_songs_update_own
on public.user_liked_songs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists liked_songs_delete_own on public.user_liked_songs;
create policy liked_songs_delete_own
on public.user_liked_songs
for delete
using (auth.uid() = user_id);

-- User playlists policies
drop policy if exists user_playlists_select_own on public.user_playlists;
create policy user_playlists_select_own
on public.user_playlists
for select
using (auth.uid() = user_id);

drop policy if exists user_playlists_insert_own on public.user_playlists;
create policy user_playlists_insert_own
on public.user_playlists
for insert
with check (auth.uid() = user_id);

drop policy if exists user_playlists_update_own on public.user_playlists;
create policy user_playlists_update_own
on public.user_playlists
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists user_playlists_delete_own on public.user_playlists;
create policy user_playlists_delete_own
on public.user_playlists
for delete
using (auth.uid() = user_id);

-- Public playlists policies
drop policy if exists public_playlists_select_public_or_owner on public.public_playlists;
create policy public_playlists_select_public_or_owner
on public.public_playlists
for select
using (is_public = true or auth.uid() = uid);

drop policy if exists public_playlists_insert_owner on public.public_playlists;
create policy public_playlists_insert_owner
on public.public_playlists
for insert
with check (auth.uid() = uid);

drop policy if exists public_playlists_update_owner on public.public_playlists;
create policy public_playlists_update_owner
on public.public_playlists
for update
using (auth.uid() = uid)
with check (auth.uid() = uid);

drop policy if exists public_playlists_delete_owner on public.public_playlists;
create policy public_playlists_delete_owner
on public.public_playlists
for delete
using (auth.uid() = uid);
