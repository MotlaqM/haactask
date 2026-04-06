-- Migration: Create projects table
-- Description: Stores user projects including the default Inbox project

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6B7280',
  is_inbox boolean not null default false,
  is_archived boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.projects enable row level security;

-- Users can only see their own projects
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

-- Users can insert their own projects
create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

-- Users can update their own projects
create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

-- Users can delete their own non-inbox projects
create policy "Users can delete their own non-inbox projects"
  on public.projects for delete
  using (auth.uid() = user_id and is_inbox = false);

-- Index for fast lookups by user
create index if not exists idx_projects_user_id on public.projects(user_id);

-- Ensure each user has at most one inbox project
create unique index if not exists idx_projects_user_inbox
  on public.projects(user_id) where is_inbox = true;
