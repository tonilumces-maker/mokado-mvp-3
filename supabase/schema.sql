
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text check (role in ('customer','owner')) default 'customer',
  created_at timestamptz default now()
);

create table if not exists public.cafes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.cafe_settings (
  cafe_id uuid primary key references public.cafes(id) on delete cascade,
  barista_pin_hash text not null,
  points_per_purchase int not null default 1,
  redeem_threshold int not null default 10
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  points_awarded int not null default 1 check (points_awarded > 0),
  created_at timestamptz default now()
);

create table if not exists public.redemptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  points_spent int not null check (points_spent > 0),
  created_at timestamptz default now()
);

create or replace view public.v_balances as
select u.id as user_id, c.id as cafe_id,
  coalesce(sum(t.points_awarded),0) - coalesce(sum(r.points_spent),0) as balance
from profiles u
cross join cafes c
left join transactions t on t.user_id = u.id and t.cafe_id = c.id
left join redemptions r on r.user_id = u.id and r.cafe_id = c.id
group by u.id, c.id;

create or replace function public.balance_for(cafe uuid)
returns int language sql security definer set search_path = public as $$
  select coalesce(sum(t.points_awarded),0) - coalesce(sum(r.points_spent),0)
  from transactions t
  left join redemptions r on r.user_id = auth.uid() and r.cafe_id = cafe
  where t.user_id = auth.uid() and t.cafe_id = cafe;
$$;

create or replace function public.award_point(cafe uuid, pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  settings record;
  recent int;
  bal int;
begin
  select cs.*, c.id as cafe_id into settings
  from cafe_settings cs
  join cafes c on c.id = cs.cafe_id
  where cs.cafe_id = cafe;

  if settings.cafe_id is null then
    raise exception 'Cafe not found';
  end if;

  if not (crypt(pin, settings.barista_pin_hash) = settings.barista_pin_hash) then
    raise exception 'Invalid PIN';
  end if;

  select count(*) into recent
  from transactions
  where user_id = auth.uid() and cafe_id = cafe and created_at > now() - interval '3 minutes';

  if recent > 0 then
    raise exception 'Too soon; try again in a few minutes';
  end if;

  insert into transactions(user_id, cafe_id, points_awarded)
  values (auth.uid(), cafe, settings.points_per_purchase);

  select public.balance_for(cafe) into bal;
  return jsonb_build_object('ok', true, 'new_balance', bal, 'threshold', settings.redeem_threshold);
end;
$$;

create or replace function public.redeem_reward(cafe uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  settings record;
  bal int;
begin
  select * into settings from cafe_settings where cafe_id = cafe;
  if settings.cafe_id is null then
    raise exception 'Cafe not found';
  end if;

  select public.balance_for(cafe) into bal;
  if bal < settings.redeem_threshold then
    raise exception 'Not enough points to redeem';
  end if;

  insert into redemptions(user_id, cafe_id, points_spent)
  values (auth.uid(), cafe, settings.redeem_threshold);

  select public.balance_for(cafe) into bal;
  return jsonb_build_object('ok', true, 'new_balance', bal);
end;
$$;

alter table public.profiles enable row level security;
alter table public.cafes enable row level security;
alter table public.cafe_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.redemptions enable row level security;

create policy "Profiles are viewable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Profiles can be updated by owner" on public.profiles for update using (auth.uid() = id);

create policy "Cafes selectable by owner" on public.cafes for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.id = owner_id));
create policy "Cafes insert by owner" on public.cafes for insert with check (exists (select 1 from profiles p where p.id = auth.uid() and p.id = owner_id));
create policy "Cafes update by owner" on public.cafes for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.id = owner_id));

create policy "Cafe settings by cafe owner" on public.cafe_settings
for all using (exists (select 1 from cafes c where c.id = cafe_id and c.owner_id = auth.uid()))
with check (exists (select 1 from cafes c where c.id = cafe_id and c.owner_id = auth.uid()));

create policy "Transactions: user can read own" on public.transactions for select using (auth.uid() = user_id);
create policy "Transactions: owner can read cafe data" on public.transactions for select using (exists (select 1 from cafes c where c.id = cafe_id and c.owner_id = auth.uid()));
create policy "Transactions: insert by function only" on public.transactions for insert with check (false);

create policy "Redemptions: user can read own" on public.redemptions for select using (auth.uid() = user_id);
create policy "Redemptions: owner can read cafe data" on public.redemptions for select using (exists (select 1 from cafes c where c.id = cafe_id and c.owner_id = auth.uid()));
create policy "Redemptions: insert by function only" on public.redemptions for insert with check (false);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New User'), 'customer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
