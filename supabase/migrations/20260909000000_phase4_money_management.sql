-- Phase 4 extends the KKU student-owned finance tables without replacing them.
alter table public.transactions
  add column if not exists work_schedule_id uuid references public.work_schedules(id) on delete set null;

alter table public.transactions
  drop constraint if exists transactions_amount_positive;
alter table public.transactions
  add constraint transactions_amount_positive check (amount > 0);

alter table public.transactions
  drop constraint if exists transactions_type_valid;
alter table public.transactions
  add constraint transactions_type_valid check (type in ('income', 'expense'));

alter table public.budgets
  drop constraint if exists budgets_amount_positive;
alter table public.budgets
  add constraint budgets_amount_positive check (amount > 0);

alter table public.budgets
  drop constraint if exists budgets_month_valid;
alter table public.budgets
  add constraint budgets_month_valid check (month between 1 and 12);

create unique index if not exists budgets_student_category_month_year_key
  on public.budgets (student_id, category, month, year);
create unique index if not exists transactions_completed_work_schedule_key
  on public.transactions (work_schedule_id)
  where work_schedule_id is not null;
create index if not exists transactions_student_date_idx
  on public.transactions (student_id, transaction_date desc);
create index if not exists work_schedules_student_date_idx
  on public.work_schedules (student_id, work_date desc);

-- Create one actual Part-time income only when a shift becomes completed.
-- Stored total_earnings and total_hours take priority over derived values.
create or replace function public.record_completed_work_income()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  resolved_hours numeric;
  resolved_amount numeric;
begin
  if new.status is distinct from 'completed' then
    return new;
  end if;

  resolved_hours := coalesce(
    new.total_hours,
    extract(epoch from (new.end_time - new.start_time)) / 3600.0
  );
  resolved_amount := coalesce(new.total_earnings, resolved_hours * new.hourly_rate);

  if resolved_hours is null or resolved_hours <= 0
    or resolved_amount is null or resolved_amount <= 0 then
    return new;
  end if;

  insert into public.transactions (
    student_id, work_schedule_id, type, amount, category,
    description, transaction_date, source
  ) values (
    new.student_id, new.id, 'income', resolved_amount, 'Part-time',
    'รายได้จากงาน Part-time', new.work_date, 'work_schedule'
  ) on conflict (work_schedule_id) where work_schedule_id is not null do nothing;

  return new;
end;
$$;

drop trigger if exists work_schedule_completed_income on public.work_schedules;
create trigger work_schedule_completed_income
  after insert or update of status, total_hours, total_earnings, hourly_rate on public.work_schedules
  for each row execute function public.record_completed_work_income();

-- Backfill completed shifts that existed before this trigger was installed.
insert into public.transactions (
  student_id, work_schedule_id, type, amount, category,
  description, transaction_date, source
)
select
  ws.student_id,
  ws.id,
  'income',
  coalesce(
    ws.total_earnings,
    coalesce(ws.total_hours, extract(epoch from (ws.end_time - ws.start_time)) / 3600.0)
      * ws.hourly_rate
  ),
  'Part-time',
  'รายได้จากงาน Part-time',
  ws.work_date,
  'work_schedule'
from public.work_schedules ws
where ws.status = 'completed'
  and coalesce(
    ws.total_earnings,
    coalesce(ws.total_hours, extract(epoch from (ws.end_time - ws.start_time)) / 3600.0)
      * ws.hourly_rate
  ) > 0
on conflict (work_schedule_id) where work_schedule_id is not null do nothing;
