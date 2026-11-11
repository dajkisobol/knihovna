-- Run in Supabase SQL Editor before enabling online synchronization.
-- Each signed-in user can only read and modify their own library data.
create table if not exists public.library_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  books jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  shelves jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.library_data enable row level security;
drop policy if exists "Users can read own library" on public.library_data;
create policy "Users can read own library" on public.library_data for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own library" on public.library_data;
create policy "Users can insert own library" on public.library_data for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own library" on public.library_data;
create policy "Users can update own library" on public.library_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
