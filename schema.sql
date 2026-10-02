create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  display_name text,
  avatar_url text,
  bio text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete set null,
  group_id uuid,
  body text not null,
  language text default 'en',
  translated_body text,
  created_at timestamptz default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key(group_id,user_id)
);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid()=id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid()=id) with check (auth.uid()=id);

create policy "messages participants read" on public.messages for select to authenticated
using (auth.uid()=sender_id or auth.uid()=receiver_id or exists(
  select 1 from public.group_members gm where gm.group_id=messages.group_id and gm.user_id=auth.uid()
));
create policy "messages own insert" on public.messages for insert to authenticated with check (auth.uid()=sender_id);

create policy "groups members read" on public.groups for select to authenticated
using (owner_id=auth.uid() or exists(select 1 from public.group_members gm where gm.group_id=groups.id and gm.user_id=auth.uid()));
create policy "groups owner insert" on public.groups for insert to authenticated with check (owner_id=auth.uid());

create policy "group membership read" on public.group_members for select to authenticated
using (user_id=auth.uid() or exists(select 1 from public.groups g where g.id=group_id and g.owner_id=auth.uid()));
create policy "group membership insert" on public.group_members for insert to authenticated with check (
  user_id=auth.uid() or exists(select 1 from public.groups g where g.id=group_id and g.owner_id=auth.uid())
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id, phone) values(new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
