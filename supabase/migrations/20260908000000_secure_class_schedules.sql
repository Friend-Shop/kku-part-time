-- Student schedules are saved as weekly wall-clock slots, not calendar files.
-- The client parses .ics locally and sends only these fields.
create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_code text,
  course_name text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_schedules_valid_time check (start_time < end_time)
);

alter table public.class_schedules enable row level security;

drop policy if exists "Students manage own class schedules" on public.class_schedules;
create policy "Students manage own class schedules"
  on public.class_schedules for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Protect against identical records even when imports happen in separate tabs.
create unique index if not exists class_schedules_unique_weekly_slot
  on public.class_schedules (
    student_id, day_of_week, start_time, end_time,
    coalesce(course_code, ''), course_name, coalesce(room, '')
  );

drop trigger if exists set_updated_at_class_schedules on public.class_schedules;
create trigger set_updated_at_class_schedules
  before update on public.class_schedules
  for each row execute function public.set_updated_at();
