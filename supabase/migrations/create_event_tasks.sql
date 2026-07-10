-- Event tasks table (replaces localStorage dhya_event_tasks)
create table if not exists public.event_tasks (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references public.events(id) on delete cascade,
  task_id          text not null,
  task_title       text not null,
  due_date         date,
  status           text default 'pending',
  assigned_members text[],
  sort_order       int default 0,
  created_at       timestamptz default now()
);

alter table public.event_tasks enable row level security;

create policy "Allow all for authenticated users"
  on public.event_tasks for all to authenticated
  using (true) with check (true);

-- Add email to general_members
alter table public.general_members
  add column if not exists email text;

-- Add email to profiles (app users already have email via auth.users,
-- but we store it here for easy lookup)
alter table public.profiles
  add column if not exists email text;
