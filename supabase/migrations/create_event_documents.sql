create table if not exists public.event_documents (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade,
  file_name  text not null,
  file_path  text not null,
  file_size  bigint,
  created_at timestamptz default now()
);

alter table public.event_documents enable row level security;

create policy "Allow all for authenticated users"
  on public.event_documents for all to authenticated
  using (true) with check (true);
