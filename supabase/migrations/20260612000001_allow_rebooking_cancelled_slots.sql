-- Allow a slot to be booked again after the previous booking was cancelled or rejected.
alter table public.bookings drop constraint if exists bookings_slot_id_key;

create unique index if not exists bookings_active_slot_id_key
  on public.bookings (slot_id)
  where booking_status in ('pending', 'accepted');

create or replace function public.notify_trainer_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_name text;
  slot_date date;
  slot_start time;
  status_label text;
begin
  select coalesce(full_name, 'Client')
    into client_name
    from public.profiles
    where id = new.client_id;

  select date, start_time
    into slot_date, slot_start
    from public.availability_slots
    where id = new.slot_id;

  status_label := case
    when new.booking_status = 'accepted' then 'auto-confirmed'
    else 'waiting for approval'
  end;

  insert into public.notifications (user_id, title, message)
  values (
    new.trainer_id,
    'New session booked',
    concat(
      coalesce(client_name, 'Client'),
      ' booked a session',
      case
        when slot_date is not null and slot_start is not null
          then concat(' on ', to_char(slot_date, 'Mon DD'), ' at ', to_char(slot_start, 'HH24:MI'))
        else ''
      end,
      ' (',
      status_label,
      ').'
    )
  );

  return new;
end;
$$;

drop trigger if exists tr_notify_trainer_new_booking on public.bookings;
create trigger tr_notify_trainer_new_booking
after insert on public.bookings
for each row
execute function public.notify_trainer_new_booking();

drop trigger if exists tr_notify_trainer_rebooked_session on public.bookings;
create trigger tr_notify_trainer_rebooked_session
after update of booking_status on public.bookings
for each row
when (
  old.booking_status in ('cancelled', 'rejected')
  and new.booking_status in ('pending', 'accepted')
)
execute function public.notify_trainer_new_booking();

revoke execute on function public.notify_trainer_new_booking() from public, anon, authenticated;
