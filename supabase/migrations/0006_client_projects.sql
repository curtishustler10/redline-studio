-- "Mon projet": a private space per client, opened with an access code, where the
-- client reads and edits the documents of her project (first one: the meeting
-- recap). Every save is kept in project_document_revisions, so any client edit
-- can be undone, and Curtis gets an internal email (logged in email_log).
--
-- Same access model as 0001: server code with the service_role key only. RLS on,
-- zero policies, privileges revoked from anon/authenticated.

-- ─── client_projects ────────────────────────────────────────────────────────

create table public.client_projects (
  id               bigint generated always as identity primary key,
  slug             text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  client_name      text not null check (length(trim(client_name)) between 1 and 200),
  title            text not null check (length(trim(title)) between 1 and 200),
  -- Readable start of the access code (AHK in AHK-7QF4-M9XC); narrows the lookup.
  code_prefix      text not null check (code_prefix ~ '^[A-Z]{2,5}$'),
  -- scrypt$N$r$p$salt$hash. The code itself is never stored.
  access_code_hash text not null check (access_code_hash like 'scrypt$%' and length(access_code_hash) <= 300),
  code_set_at      timestamptz not null default now(),
  -- IANA zone the client's dates are shown in.
  time_zone        text not null default 'Europe/Paris',
  created_at       timestamptz not null default now()
);

create index client_projects_code_prefix_idx on public.client_projects (code_prefix);

-- ─── project_documents ──────────────────────────────────────────────────────

create table public.project_documents (
  id          bigint generated always as identity primary key,
  project_id  bigint not null references public.client_projects (id) on delete cascade,
  slug        text not null check (slug ~ '^[a-z0-9-]{1,60}$'),
  title       text not null check (length(trim(title)) between 1 and 200),
  -- { version: 1, sections: [...] } — shape validated in lib/project-doc.ts.
  content     jsonb not null check (jsonb_typeof(content) = 'object' and pg_column_size(content) <= 200000),
  -- Optimistic lock: a save must present the updated_at it started from.
  updated_at  timestamptz not null default now(),
  updated_by  text not null check (updated_by in ('seed', 'client', 'admin')),
  created_at  timestamptz not null default now(),
  -- Also serves as the index on project_id.
  unique (project_id, slug)
);

-- ─── project_document_revisions ─────────────────────────────────────────────
-- One row per version, the first one being the seed. "restrict" on purpose: a
-- document with history cannot be deleted by accident (nor its project).

create table public.project_document_revisions (
  id          bigint generated always as identity primary key,
  document_id bigint not null references public.project_documents (id) on delete restrict,
  content     jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_by  text not null check (updated_by in ('seed', 'client', 'admin')),
  created_at  timestamptz not null default now()
);

create index project_document_revisions_doc_idx on public.project_document_revisions (document_id, id desc);

-- ─── portal_login_attempts ──────────────────────────────────────────────────
-- Failed code entries, counted in Postgres for the same reason as 0002.

create table public.portal_login_attempts (
  id bigint generated always as identity primary key,
  ip text not null check (length(ip) <= 100),
  at timestamptz not null default now()
);

create index portal_login_attempts_ip_at_idx on public.portal_login_attempts (ip, at desc);

-- ─── email_log: project notifications ───────────────────────────────────────
-- A project mail has no lead; it points at the project instead. Exactly one of
-- the two is set.

alter table public.email_log alter column lead_id drop not null;
alter table public.email_log add column project_id bigint references public.client_projects (id) on delete cascade;
alter table public.email_log add constraint email_log_one_subject check (num_nonnulls(lead_id, project_id) = 1);
create index email_log_project_idx on public.email_log (project_id, created_at desc) where project_id is not null;

alter table public.email_log drop constraint email_log_kind_check;
alter table public.email_log add constraint email_log_kind_check check (kind in (
  'rdv_confirmation', 'rdv_reminder', 'rdv_rescheduled', 'rdv_cancelled',
  'rdv_no_show', 'rdv_follow_up', 'contact_auto_reply',
  'internal_rdv', 'internal_contact', 'internal_project_edit'));

-- ─── save_project_document ──────────────────────────────────────────────────
-- Compare-and-set + revision in one transaction. Returns status 'ok', 'conflict'
-- (someone saved since p_expected_updated_at) or 'not_found'. On 'ok' it also
-- returns the previous content, read under the row lock, for the email diff.

create or replace function public.save_project_document(
  p_document_id bigint,
  p_expected_updated_at timestamptz,
  p_content jsonb,
  p_updated_by text
)
returns table (status text, updated_at timestamptz, revision_id bigint, previous_content jsonb)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current_at timestamptz;
  v_previous   jsonb;
  v_now        timestamptz := clock_timestamp();
  v_revision   bigint;
begin
  select d.updated_at, d.content into v_current_at, v_previous
  from public.project_documents d
  where d.id = p_document_id
  for update;

  if not found then
    return query select 'not_found'::text, null::timestamptz, null::bigint, null::jsonb;
    return;
  end if;

  if v_current_at <> p_expected_updated_at then
    return query select 'conflict'::text, v_current_at, null::bigint, null::jsonb;
    return;
  end if;

  update public.project_documents d
  set content = p_content, updated_at = v_now, updated_by = p_updated_by
  where d.id = p_document_id;

  insert into public.project_document_revisions (document_id, content, updated_by)
  values (p_document_id, p_content, p_updated_by)
  returning id into v_revision;

  return query select 'ok'::text, v_now, v_revision, v_previous;
end;
$$;

-- ─── Lock down ──────────────────────────────────────────────────────────────

alter table public.client_projects            enable row level security;
alter table public.project_documents          enable row level security;
alter table public.project_document_revisions enable row level security;
alter table public.portal_login_attempts      enable row level security;

revoke all on public.client_projects, public.project_documents, public.project_document_revisions, public.portal_login_attempts
  from anon, authenticated;

revoke all on function public.save_project_document(bigint, timestamptz, jsonb, text) from public, anon, authenticated;
grant execute on function public.save_project_document(bigint, timestamptz, jsonb, text) to service_role;
