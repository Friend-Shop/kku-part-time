-- KKU uses the same UUID for auth.users.id and student_profiles.id.
-- class_schedules.student_id therefore references the student's profile UUID.
alter table public.class_schedules enable row level security;

drop policy if exists "Students manage own class schedules" on public.class_schedules;
create policy "Students manage own class schedules"
  on public.class_schedules for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
