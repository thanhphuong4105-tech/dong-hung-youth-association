-- Vietnamese School tables

create table if not exists public.vs_semesters (
  id          text primary key,
  name        text not null,
  start_date  text,
  end_date    text,
  status      text default 'Upcoming',
  cal_events  jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.vs_classes (
  id          text primary key,
  semester_id text references public.vs_semesters(id) on delete cascade,
  class_name  text not null,
  level       text,
  teacher     text,
  assistants  jsonb default '[]'::jsonb,
  day_of_week text,
  start_time  text,
  end_time    text,
  room        text,
  created_at  timestamptz default now()
);

create table if not exists public.vs_students (
  id          text primary key,
  semester_id text references public.vs_semesters(id) on delete cascade,
  class_id    text references public.vs_classes(id) on delete set null,
  first_name  text,
  last_name   text,
  birthday    text,
  allergy     text,
  parents     jsonb default '[]'::jsonb,
  age         int,
  created_at  timestamptz default now()
);

create table if not exists public.vs_lessons (
  id          text primary key,
  semester_id text references public.vs_semesters(id) on delete cascade,
  class_id    text references public.vs_classes(id) on delete cascade,
  title       text not null,
  date        text,
  topic       text,
  materials   text,
  status      text default 'Planned',
  created_at  timestamptz default now()
);

create table if not exists public.vs_attendance (
  id          text primary key,
  class_id    text references public.vs_classes(id) on delete cascade,
  student_id  text references public.vs_students(id) on delete cascade,
  date        text not null,
  status      text,
  note        text,
  created_at  timestamptz default now()
);

-- RLS
alter table public.vs_semesters  enable row level security;
alter table public.vs_classes    enable row level security;
alter table public.vs_students   enable row level security;
alter table public.vs_lessons    enable row level security;
alter table public.vs_attendance enable row level security;

create policy "Allow all for authenticated users" on public.vs_semesters  for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated users" on public.vs_classes    for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated users" on public.vs_students   for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated users" on public.vs_lessons    for all to authenticated using (true) with check (true);
create policy "Allow all for authenticated users" on public.vs_attendance for all to authenticated using (true) with check (true);
