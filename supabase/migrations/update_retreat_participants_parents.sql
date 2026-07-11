alter table public.retreat_participants
  add column if not exists birthday text,
  add column if not exists parents  jsonb default '[]'::jsonb;
