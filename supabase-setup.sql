-- TSMHST Portal — Supabase setup (one time, run in Supabase → SQL Editor)
--
-- 1) This table stores the small portal records (documents, payments,
--    submissions) as jsonb payloads. File contents go to Storage.
create table if not exists cloud_records (
  table_name text not null,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  primary key (table_name, id)
);
alter table cloud_records enable row level security;
create policy "cloud anon read"   on cloud_records for select to anon using (true);
create policy "cloud anon insert" on cloud_records for insert to anon with check (true);
create policy "cloud anon update" on cloud_records for update to anon using (true) with check (true);

-- 2) Storage bucket for attachments (payment proofs, vault files, submissions).
insert into storage.buckets (id, name, public) values ('portal-files', 'portal-files', false)
  on conflict (id) do nothing;
create policy "portal files anon read"  on storage.objects for select to anon
  using (bucket_id = 'portal-files');
create policy "portal files anon write" on storage.objects for insert to anon
  with check (bucket_id = 'portal-files');

-- Security notes
-- • The anon key ships inside the app, so anyone holding it can write these
--   tables/bucket. Object paths are unguessable ids and listing stays private,
--   but treat the synced data as portal-internal.
-- • If the key ever leaks: rotate it in Supabase → Settings → API and update
--   the portal's Cloud sync settings.
-- • For stricter access later, add Supabase Auth and scope these policies to
--   authenticated users instead of anon.
