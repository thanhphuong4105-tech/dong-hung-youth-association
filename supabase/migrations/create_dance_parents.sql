create table if not exists public.dance_parents (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references public.events(id) on delete cascade,
  parent_name   text not null,
  phone_number  text,
  children_names text[],
  status        text default 'not_asked',
  notes         text,
  sort_order    int,
  created_at    timestamptz default now()
);

alter table public.dance_parents enable row level security;

create policy "Allow all for authenticated users"
  on public.dance_parents
  for all
  to authenticated
  using (true)
  with check (true);
