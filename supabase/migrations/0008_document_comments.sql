-- "Mon projet": comments pinned on a page-image document (first one: Ergoligne's
-- prevention booklet). The client reads the document page by page, taps the spot
-- she means and leaves a comment there. Curtis reads them in /admin/projets,
-- grouped by page, and gets an internal email for every action.
--
-- Why a table and not the document/revision model: a project document is saved
-- whole, with a compare-and-set on updated_at. Comments are many small,
-- independent writes (often from a phone and a computer at once): stored inside
-- the document, every comment would rewrite it and two open tabs would refuse
-- each other's comments. Here each comment is its own row, and the document
-- (project_documents, kind "pages") only describes the pages.
--
-- Nothing the client writes is lost, same promise as the revisions: a deletion
-- only sets deleted_at, and every action leaves an event row with the text as it
-- was (project_document_comment_events, never deleted).
--
-- Pin position is in percent of the page (x from the left, y from the top), so
-- it stays on the same element whatever the screen size. `label` (« p. 6,
-- scène 2 ») is written by the server when the comment is made, so a comment
-- stays readable even if the page list changes later.
--
-- Same access model as 0006: server code with the service_role key only. RLS on,
-- zero policies, privileges revoked from anon/authenticated. Additive only.

-- ─── project_document_comments ──────────────────────────────────────────────

create table public.project_document_comments (
  id          bigint generated always as identity primary key,
  document_id bigint not null references public.project_documents (id) on delete restrict,
  page        integer not null check (page between 1 and 500),
  x           double precision not null check (x >= 0 and x <= 100),
  y           double precision not null check (y >= 0 and y <= 100),
  label       text not null check (length(label) <= 200),
  body        text not null check (char_length(body) between 1 and 2000),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  -- The client edits and deletes only her own comments; 'admin' keeps room for a
  -- reply from Curtis without a new table.
  author      text not null default 'client' check (author in ('client', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index project_document_comments_doc_idx
  on public.project_document_comments (document_id, page, created_at);

-- ─── project_document_comment_events ────────────────────────────────────────
-- One row per action, with the text and status after it (and the text before it
-- for an edit). The internal email of an action is deduplicated on this id.

create table public.project_document_comment_events (
  id            bigint generated always as identity primary key,
  comment_id    bigint not null references public.project_document_comments (id) on delete restrict,
  action        text not null check (action in ('added', 'edited', 'resolved', 'reopened', 'deleted')),
  body          text not null,
  previous_body text,
  status        text not null check (status in ('open', 'resolved')),
  actor         text not null check (actor in ('client', 'admin')),
  created_at    timestamptz not null default now()
);

create index project_document_comment_events_comment_idx
  on public.project_document_comment_events (comment_id, id);

-- ─── apply_document_comment ─────────────────────────────────────────────────
-- Every client action on a comment, with its event, in one transaction.
-- p_action: 'add' (p_page, p_x, p_y, p_label, p_body), 'edit' (p_comment_id,
-- p_body), 'resolve' | 'reopen' | 'delete' (p_comment_id).
-- Returns status 'ok', 'unchanged' (same text, same status: nothing written),
-- 'not_found' (no such live comment of the client on this document) or 'limit'
-- (too many comments on the document). On 'ok', event_id is the new event.
-- Inputs are validated by the server code first; the table checks are the backstop.

create or replace function public.apply_document_comment(
  p_document_id bigint,
  p_action      text,
  p_comment_id  bigint default null,
  p_page        integer default null,
  p_x           double precision default null,
  p_y           double precision default null,
  p_label       text default null,
  p_body        text default null
)
returns table (status text, comment_id bigint, event_id bigint, page integer, label text, body text, previous_body text, comment_status text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row   public.project_document_comments%rowtype;
  v_event bigint;
  v_prev  text;
  v_live  integer;
  v_now   timestamptz := clock_timestamp();
begin
  if p_action = 'add' then
    perform 1 from public.project_documents d where d.id = p_document_id for update;
    if not found then
      return query select 'not_found'::text, null::bigint, null::bigint, null::integer, null::text, null::text, null::text, null::text;
      return;
    end if;
    select count(*) into v_live from public.project_document_comments c where c.document_id = p_document_id and c.deleted_at is null;
    if v_live >= 500 then
      return query select 'limit'::text, null::bigint, null::bigint, null::integer, null::text, null::text, null::text, null::text;
      return;
    end if;
    insert into public.project_document_comments (document_id, page, x, y, label, body, author, created_at, updated_at)
    values (p_document_id, p_page, p_x, p_y, p_label, p_body, 'client', v_now, v_now)
    returning * into v_row;
    insert into public.project_document_comment_events (comment_id, action, body, status, actor)
    values (v_row.id, 'added', v_row.body, v_row.status, 'client')
    returning id into v_event;
    return query select 'ok'::text, v_row.id, v_event, v_row.page, v_row.label, v_row.body, null::text, v_row.status;
    return;
  end if;

  if p_action not in ('edit', 'resolve', 'reopen', 'delete') then
    raise exception 'apply_document_comment: unknown action %', p_action;
  end if;

  select * into v_row
  from public.project_document_comments c
  where c.id = p_comment_id and c.document_id = p_document_id and c.author = 'client' and c.deleted_at is null
  for update;
  if not found then
    return query select 'not_found'::text, null::bigint, null::bigint, null::integer, null::text, null::text, null::text, null::text;
    return;
  end if;

  if (p_action = 'edit' and v_row.body = p_body)
     or (p_action = 'resolve' and v_row.status = 'resolved')
     or (p_action = 'reopen' and v_row.status = 'open') then
    return query select 'unchanged'::text, v_row.id, null::bigint, v_row.page, v_row.label, v_row.body, null::text, v_row.status;
    return;
  end if;

  v_prev := v_row.body;
  if p_action = 'edit' then
    update public.project_document_comments c set body = p_body, updated_at = v_now where c.id = v_row.id returning * into v_row;
  elsif p_action = 'resolve' then
    update public.project_document_comments c set status = 'resolved', updated_at = v_now where c.id = v_row.id returning * into v_row;
  elsif p_action = 'reopen' then
    update public.project_document_comments c set status = 'open', updated_at = v_now where c.id = v_row.id returning * into v_row;
  else
    update public.project_document_comments c set deleted_at = v_now, updated_at = v_now where c.id = v_row.id returning * into v_row;
  end if;

  insert into public.project_document_comment_events (comment_id, action, body, previous_body, status, actor)
  values (
    v_row.id,
    case p_action when 'edit' then 'edited' when 'resolve' then 'resolved' when 'reopen' then 'reopened' else 'deleted' end,
    v_row.body,
    case when p_action = 'edit' then v_prev end,
    v_row.status,
    'client'
  )
  returning id into v_event;

  return query select 'ok'::text, v_row.id, v_event, v_row.page, v_row.label, v_row.body,
    case when p_action = 'edit' then v_prev end, v_row.status;
end;
$$;

-- ─── Lock down ──────────────────────────────────────────────────────────────

alter table public.project_document_comments        enable row level security;
alter table public.project_document_comment_events  enable row level security;

revoke all on public.project_document_comments, public.project_document_comment_events from anon, authenticated;

revoke all on function public.apply_document_comment(bigint, text, bigint, integer, double precision, double precision, text, text) from public, anon, authenticated;
grant execute on function public.apply_document_comment(bigint, text, bigint, integer, double precision, double precision, text, text) to service_role;
