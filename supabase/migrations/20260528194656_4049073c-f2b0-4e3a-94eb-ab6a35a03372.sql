
create table public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  business_idea text not null,
  industry text not null,
  stage text not null,
  referral_source text,
  status text not null default 'pending'
);

grant insert on public.workshop_registrations to anon, authenticated;
grant all on public.workshop_registrations to service_role;

alter table public.workshop_registrations enable row level security;

create policy "anyone can register"
  on public.workshop_registrations
  for insert
  to anon, authenticated
  with check (true);
