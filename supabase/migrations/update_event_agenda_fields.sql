alter table public.event_agenda
  add column if not exists end_time    text,
  add column if not exists description text;
