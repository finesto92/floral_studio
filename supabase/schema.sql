create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "Allow anonymous MVP app state read" on public.app_state;
create policy "Allow anonymous MVP app state read"
on public.app_state
for select
to anon
using (id = 'default');

drop policy if exists "Allow anonymous MVP app state write" on public.app_state;
create policy "Allow anonymous MVP app state write"
on public.app_state
for insert
to anon
with check (id = 'default');

drop policy if exists "Allow anonymous MVP app state update" on public.app_state;
create policy "Allow anonymous MVP app state update"
on public.app_state
for update
to anon
using (id = 'default')
with check (id = 'default');

insert into public.app_state (id, data)
values ('default', '{"products":[],"deliveryAreas":[],"orders":[],"customers":[],"notifications":[]}'::jsonb)
on conflict (id) do nothing;
