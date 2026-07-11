create table if not exists public.retreat_participants (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade,
  name        text not null,
  birthday    text,
  phone       text,
  notes       text,
  parents     jsonb default '[]'::jsonb,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

alter table public.retreat_participants enable row level security;

create policy "Allow all for authenticated users"
  on public.retreat_participants for all to authenticated
  using (true) with check (true);
