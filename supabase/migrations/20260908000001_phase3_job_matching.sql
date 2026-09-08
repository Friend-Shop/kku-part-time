-- Profile inputs used by the matching engine.
alter table public.student_profiles
  add column if not exists skills text[] not null default '{}',
  add column if not exists preferred_job_types text[] not null default '{}',
  add column if not exists preferred_work_days smallint[] not null default '{}',
  add column if not exists min_hourly_rate numeric;

alter table public.jobs add column if not exists required_skills text[] not null default '{}';

alter table public.job_matches
  add column if not exists schedule_score numeric,
  add column if not exists skill_score numeric,
  add column if not exists distance_score numeric,
  add column if not exists preference_score numeric,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists job_matches_student_job_key
  on public.job_matches (student_id, job_id);

alter table public.job_matches enable row level security;
drop policy if exists "Students read own job matches" on public.job_matches;
drop policy if exists "Students can view own matches" on public.job_matches;
create policy "Students can view own matches" on public.job_matches
  for select to authenticated using (student_id = auth.uid());
drop policy if exists "Employers read matches for own jobs" on public.job_matches;
drop policy if exists "Employers can view matches" on public.job_matches;
create policy "Employers can view matches" on public.job_matches
  for select to authenticated using (
    exists (
      select 1
      from public.jobs
      join public.stores on stores.id = jobs.store_id
      where jobs.id = job_matches.job_id
        and stores.employer_id = auth.uid()
    )
  );
drop policy if exists "Students write own job matches" on public.job_matches;
create policy "Students write own job matches" on public.job_matches
  for insert to authenticated with check (student_id = auth.uid());
drop policy if exists "Students update own job matches" on public.job_matches;
create policy "Students update own job matches" on public.job_matches
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

alter table public.work_schedules enable row level security;
drop policy if exists "Students read own work schedules" on public.work_schedules;
drop policy if exists "Students can view own work schedules" on public.work_schedules;
create policy "Students can view own work schedules" on public.work_schedules
  for select to authenticated using (student_id = auth.uid());

-- Applications remain unique even if a student clicks apply twice.
create unique index if not exists applications_student_job_key
  on public.applications (student_id, job_id);

-- Only the student who owns a notification can read or mark it read.
alter table public.notifications enable row level security;
drop policy if exists "Users read own notifications" on public.notifications;
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.set_job_matches_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_job_matches on public.job_matches;
create trigger set_updated_at_job_matches before update on public.job_matches
  for each row execute function public.set_job_matches_updated_at();

-- Application events create notifications from the database, never from
-- browser-only state. Work shifts remain employer-scheduled dated records.
create or replace function public.notify_application_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare employer_user_id uuid;
begin
  select stores.employer_id into employer_user_id
  from public.jobs
  join public.stores on stores.id = jobs.store_id
  where jobs.id = new.job_id;
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, title, message)
    values (employer_user_id, 'มีผู้สมัครงานใหม่', 'มีนักศึกษาสมัครงานของคุณ');
  elsif new.status is distinct from old.status then
    insert into public.notifications (user_id, title, message)
    values (new.student_id, 'สถานะใบสมัครเปลี่ยนแล้ว', 'ใบสมัครของคุณมีสถานะ: ' || coalesce(new.status, 'pending'));
  end if;
  return new;
end;
$$;

drop trigger if exists application_notification_created on public.applications;
create trigger application_notification_created after insert on public.applications
  for each row execute function public.notify_application_event();
drop trigger if exists application_notification_status_changed on public.applications;
create trigger application_notification_status_changed after update of status on public.applications
  for each row execute function public.notify_application_event();
