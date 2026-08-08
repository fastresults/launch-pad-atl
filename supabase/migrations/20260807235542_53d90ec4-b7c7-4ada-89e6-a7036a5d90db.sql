alter table public.venture_shares
  add column if not exists chat_enabled boolean not null default true;