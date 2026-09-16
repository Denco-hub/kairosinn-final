-- Run this once in the Supabase SQL Editor.
-- It creates an owner-readable audit trail without exposing the owner account
-- or credentials to managers.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx
  on public.activity_logs (created_at desc);

create index if not exists activity_logs_actor_user_id_idx
  on public.activity_logs (actor_user_id);

alter table public.activity_logs enable row level security;

-- Only owners can read the audit trail.
drop policy if exists "Owners can read activity logs" on public.activity_logs;
create policy "Owners can read activity logs"
on public.activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'owner'
  )
);

-- The trigger function writes audit rows with elevated privileges. Normal
-- authenticated users do not receive direct insert/update/delete access.
drop policy if exists "No direct activity log inserts" on public.activity_logs;
create policy "No direct activity log inserts"
on public.activity_logs
for insert
to authenticated
with check (false);

create or replace function public.write_activity_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  row_data jsonb;
  entity_id_value text;
  entity_label text;
begin
  if actor is null then
    return coalesce(new, old);
  end if;

  row_data := case
    when tg_op = 'DELETE' then to_jsonb(old)
    else to_jsonb(new)
  end;

  entity_id_value := coalesce(row_data->>'id', row_data->>'user_id');
  entity_label := coalesce(
    row_data->>'guest_name',
    row_data->>'display_name',
    row_data->>'description',
    row_data->>'full_name',
    entity_id_value
  );

  insert into public.activity_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    description
  ) values (
    actor,
    lower(tg_op),
    tg_table_name,
    entity_id_value,
    initcap(lower(tg_op)) || ' ' || tg_table_name || case
      when entity_label is not null then ': ' || left(entity_label, 120)
      else ''
    end
  );

  return coalesce(new, old);
end;
$$;

-- Install triggers only for tables that already exist in this project.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'bookings',
    'rooms',
    'transactions',
    'reviews',
    'messages',
    'user_roles'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists audit_%I on public.%I', table_name, table_name);
      execute format(
        'create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.write_activity_log()',
        table_name,
        table_name
      );
    end if;
  end loop;
end;
$$;
