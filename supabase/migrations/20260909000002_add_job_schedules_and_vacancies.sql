-- Job vacancies column (number of people the employer wants to hire)
alter table public.jobs
  add column if not exists vacancies int not null default 1 check (vacancies > 0);

-- Weekly time slots for each job opening. Employers define which days/hours
-- they need staff; the matching engine compares these against class schedules.
create table if not exists public.job_schedules (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_schedules_valid_time check (start_time < end_time)
);

create unique index if not exists job_schedules_unique_slot
  on public.job_schedules (job_id, day_of_week, start_time, end_time);

create index if not exists job_schedules_job_id_idx
  on public.job_schedules (job_id);

alter table public.job_schedules enable row level security;

drop policy if exists "Anyone can read job schedules" on public.job_schedules;
drop policy if exists "Students can view job schedules" on public.job_schedules;
create policy "Students can view job schedules" on public.job_schedules
  for select to authenticated using (true);

drop policy if exists "Employers manage own job schedules" on public.job_schedules;
create policy "Employers manage own job schedules" on public.job_schedules
  for all to authenticated using (
    exists (
      select 1
      from public.jobs
      join public.stores on stores.id = jobs.store_id
      where jobs.id = job_schedules.job_id
        and stores.employer_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.jobs
      join public.stores on stores.id = jobs.store_id
      where jobs.id = job_schedules.job_id
        and stores.employer_id = auth.uid()
    )
  );

drop trigger if exists set_updated_at_job_schedules on public.job_schedules;
create trigger set_updated_at_job_schedules
  before update on public.job_schedules
  for each row execute function public.set_updated_at();

-- Ensure employers can always read their own jobs (defensive policy)
drop policy if exists "Employers manage own jobs" on public.jobs;
drop policy if exists "Employers can manage own jobs" on public.jobs;
create policy "Employers can manage own jobs" on public.jobs
  for all to authenticated using (
    exists (
      select 1
      from public.stores
      where stores.id = jobs.store_id
        and stores.employer_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.stores
      where stores.id = jobs.store_id
        and stores.employer_id = auth.uid()
    )
  );

drop policy if exists "Students can view open jobs" on public.jobs;
drop policy if exists "Students view open jobs" on public.jobs;
create policy "Students view open jobs" on public.jobs
  for select to authenticated using (true);

-- Ensure stores RLS for employers
drop policy if exists "Employers manage own stores" on public.stores;
drop policy if exists "Employers can manage own stores" on public.stores;
create policy "Employers can manage own stores" on public.stores
  for all to authenticated using (employer_id = auth.uid())
  with check (employer_id = auth.uid());

drop policy if exists "Authenticated can view stores" on public.stores;
create policy "Authenticated can view stores" on public.stores
  for select to authenticated using (true);
