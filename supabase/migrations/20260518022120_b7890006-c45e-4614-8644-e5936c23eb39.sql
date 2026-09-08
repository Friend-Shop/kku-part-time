
-- Enums
create type public.app_role as enum ('client','trainer','admin');
create type public.fitness_goal as enum ('weight_loss','muscle_gain','body_recomposition','strength_training','general_fitness');
create type public.booking_status as enum ('pending','accepted','rejected','cancelled','completed');
create type public.gender_type as enum ('male','female','other');
create type public.experience_pref as enum ('any','beginner','intermediate','advanced');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  gender gender_type,
  latitude double precision,
  longitude double precision,
  fitness_goal fitness_goal,
  budget_min numeric,
  budget_max numeric,
  preferred_trainer_gender gender_type,
  preferred_experience experience_pref default 'any',
  available_times jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);

-- Has role function
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.get_user_role(_user_id uuid)
returns app_role
language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id=_user_id limit 1
$$;

-- Trainer profiles
create table public.trainer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  bio text,
  specialties text[] default '{}',
  certifications text[] default '{}',
  specialized_goals fitness_goal[] default '{}',
  experience_years int default 0,
  price_per_session numeric default 0,
  rating numeric default 0,
  rating_count int default 0,
  training_location text,
  gym_name text,
  is_approved boolean default true,
  is_suspended boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Availability slots
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  day_of_week int,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  unique(trainer_id, date, start_time)
);

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  slot_id uuid not null references public.availability_slots(id) on delete cascade,
  booking_status booking_status not null default 'pending',
  total_price numeric default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(slot_id)  -- prevents double booking
);

-- Trainer matches (cached)
create table public.trainer_matches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  match_score numeric not null default 0,
  match_reason jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(client_id, trainer_id)
);

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Pose sessions
create table public.pose_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  accuracy_score numeric default 0,
  feedback_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.trainer_profiles enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.trainer_matches enable row level security;
alter table public.reviews enable row level security;
alter table public.pose_sessions enable row level security;
alter table public.notifications enable row level security;

-- profiles policies
create policy "Profiles viewable by authenticated" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid()=id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid()=id);
create policy "Admins manage profiles" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin'));

-- user_roles policies
create policy "Users view own roles" on public.user_roles for select to authenticated using (auth.uid()=user_id or public.has_role(auth.uid(),'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Users insert own initial role" on public.user_roles for insert to authenticated with check (auth.uid()=user_id);

-- trainer_profiles
create policy "Trainer profiles viewable" on public.trainer_profiles for select to authenticated using (true);
create policy "Trainer manages own profile" on public.trainer_profiles for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Admin manages trainer profiles" on public.trainer_profiles for all to authenticated using (public.has_role(auth.uid(),'admin'));

-- availability_slots
create policy "Slots viewable" on public.availability_slots for select to authenticated using (true);
create policy "Trainer manages own slots" on public.availability_slots for all to authenticated using (auth.uid()=trainer_id) with check (auth.uid()=trainer_id);

-- bookings
create policy "Client sees own bookings" on public.bookings for select to authenticated using (auth.uid()=client_id or auth.uid()=trainer_id or public.has_role(auth.uid(),'admin'));
create policy "Client creates booking" on public.bookings for insert to authenticated with check (auth.uid()=client_id);
create policy "Client or trainer updates booking" on public.bookings for update to authenticated using (auth.uid()=client_id or auth.uid()=trainer_id);
create policy "Admin manages bookings" on public.bookings for all to authenticated using (public.has_role(auth.uid(),'admin'));

-- trainer_matches
create policy "Client sees own matches" on public.trainer_matches for select to authenticated using (auth.uid()=client_id);
create policy "Client manages own matches" on public.trainer_matches for all to authenticated using (auth.uid()=client_id) with check (auth.uid()=client_id);

-- reviews
create policy "Reviews viewable" on public.reviews for select to authenticated using (true);
create policy "Client creates own review" on public.reviews for insert to authenticated with check (auth.uid()=client_id);
create policy "Client updates own review" on public.reviews for update to authenticated using (auth.uid()=client_id);

-- pose_sessions
create policy "Client manages own pose" on public.pose_sessions for all to authenticated using (auth.uid()=client_id) with check (auth.uid()=client_id);

-- notifications
create policy "User reads own notifications" on public.notifications for select to authenticated using (auth.uid()=user_id);
create policy "User updates own notifications" on public.notifications for update to authenticated using (auth.uid()=user_id);
create policy "System creates notifications" on public.notifications for insert to authenticated with check (true);

-- Trigger to create profile + role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  _role app_role;
begin
  _role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'client'::app_role);

  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);

  insert into public.user_roles (user_id, role) values (new.id, _role);

  if _role = 'trainer' then
    insert into public.trainer_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_trainer_profiles before update on public.trainer_profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_bookings before update on public.bookings for each row execute function public.set_updated_at();
