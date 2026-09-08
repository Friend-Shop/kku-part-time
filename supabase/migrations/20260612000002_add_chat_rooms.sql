-- One chat room per client/trainer pair, with messages visible only to participants.
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, trainer_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Participants read chat rooms" on public.chat_rooms;
create policy "Participants read chat rooms" on public.chat_rooms
  for select to authenticated
  using (auth.uid() = client_id or auth.uid() = trainer_id);

drop policy if exists "Participants create chat rooms" on public.chat_rooms;
create policy "Participants create chat rooms" on public.chat_rooms
  for insert to authenticated
  with check (
    (auth.uid() = client_id or auth.uid() = trainer_id)
    and exists (
      select 1
      from public.bookings booking
      where booking.client_id = chat_rooms.client_id
        and booking.trainer_id = chat_rooms.trainer_id
        and booking.booking_status in ('pending', 'accepted')
    )
  );

drop policy if exists "Participants update chat rooms" on public.chat_rooms;
create policy "Participants update chat rooms" on public.chat_rooms
  for update to authenticated
  using (auth.uid() = client_id or auth.uid() = trainer_id)
  with check (
    (auth.uid() = client_id or auth.uid() = trainer_id)
    and exists (
      select 1
      from public.bookings booking
      where booking.client_id = chat_rooms.client_id
        and booking.trainer_id = chat_rooms.trainer_id
        and booking.booking_status in ('pending', 'accepted')
    )
  );

drop policy if exists "Participants read chat messages" on public.chat_messages;
create policy "Participants read chat messages" on public.chat_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.chat_rooms room
      where room.id = room_id
        and (auth.uid() = room.client_id or auth.uid() = room.trainer_id)
    )
  );

drop policy if exists "Participants create chat messages" on public.chat_messages;
create policy "Participants create chat messages" on public.chat_messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.chat_rooms room
      where room.id = room_id
        and (auth.uid() = room.client_id or auth.uid() = room.trainer_id)
        and exists (
          select 1
          from public.bookings booking
          where booking.client_id = room.client_id
            and booking.trainer_id = room.trainer_id
            and booking.booking_status in ('pending', 'accepted')
        )
    )
  );

create index if not exists chat_rooms_client_id_idx on public.chat_rooms (client_id);
create index if not exists chat_rooms_trainer_id_idx on public.chat_rooms (trainer_id);
create index if not exists chat_messages_room_id_created_at_idx
  on public.chat_messages (room_id, created_at);
