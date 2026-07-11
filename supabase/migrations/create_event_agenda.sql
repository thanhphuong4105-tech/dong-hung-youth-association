create table if not exists public.event_agenda (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade,
  time        text not null,
  title       text not null,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.event_agenda enable row level security;

create policy "Allow all for authenticated users"
  on public.event_agenda for all to authenticated
  using (true) with check (true);
