-- Redline Studio CRM: leads, appointments (RDV) and the email log that makes
-- every notification idempotent.
--
-- Access model (same as Fenua): the browser never talks to Postgres. Every read
-- and write goes through server code holding the service_role key. RLS is on
-- with zero policies and table privileges are revoked from anon/authenticated,
-- so a policy added by mistake later still cannot expose a row on its own.

-- ─── updated_at ─────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── leads ──────────────────────────────────────────────────────────────────
-- Replaces data/leads.json, which never persisted on Vercel (read-only FS).

create table public.leads (
  id            bigint generated always as identity primary key,
  name          text not null check (length(trim(name)) between 1 and 200),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 320),
  phone         text check (length(phone) <= 40),
  company       text check (length(company) <= 200),
  lang          text not null default 'fr' check (lang in ('fr', 'en')),
  -- IANA zone of the lead: every lead-facing time is rendered in it.
  time_zone     text not null default 'Pacific/Tahiti',
  source        text not null default 'form' check (source in ('form', 'chat', 'diagnostic', 'whatsapp', 'manual')),
  service       text check (length(service) <= 200),
  message       text check (length(message) <= 5000),
  status        text not null default 'new' check (status in ('new', 'contacted', 'rdv', 'proposal', 'won', 'lost')),
  notes         text,
  -- Secret for the public /rdv/<token> self-booking page; null until generated.
  booking_token text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index leads_status_created_idx on public.leads (status, created_at desc);
create index leads_email_idx on public.leads (lower(email));

create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- ─── appointments ───────────────────────────────────────────────────────────

create table public.appointments (
  id           bigint generated always as identity primary key,
  lead_id      bigint not null references public.leads (id) on delete cascade,
  starts_at    timestamptz not null,
  duration_min integer not null default 30 check (duration_min between 5 and 240),
  mode         text not null default 'phone' check (mode in ('phone', 'visio', 'in-person')),
  -- Visio URL or street address, depending on mode.
  location     text check (length(location) <= 500),
  -- Number Curtis calls when mode = 'phone'.
  phone        text check (length(phone) <= 40),
  time_zone    text not null,
  status       text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'done', 'no_show')),
  -- Calendar SEQUENCE: bumped on every reschedule/cancel so .ics updates apply in order.
  sequence     integer not null default 0 check (sequence >= 0),
  -- Who set it: Curtis from the lead file, or the lead through the booking link.
  booked_via   text not null check (booked_via in ('admin', 'booking_link')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (mode <> 'visio' or location is not null)
);

create index appointments_lead_idx on public.appointments (lead_id);
-- Reminder cron: "scheduled RDVs starting in the next ~24 h".
create index appointments_upcoming_idx on public.appointments (starts_at) where status = 'scheduled';
-- A lead has at most one upcoming RDV; rescheduling updates the row instead.
create unique index appointments_one_scheduled_per_lead on public.appointments (lead_id) where status = 'scheduled';

create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();

-- ─── email_log ──────────────────────────────────────────────────────────────
-- One row per notification. The sender claims a row (status 'pending') with a
-- deterministic dedupe_key BEFORE calling the provider; the unique constraint
-- makes a retried cron run or a double-click a no-op instead of a second mail.
-- Example keys: 'rdv_reminder:apt:12:seq:0', 'contact_auto_reply:lead:40'.

create table public.email_log (
  id             bigint generated always as identity primary key,
  lead_id        bigint not null references public.leads (id) on delete cascade,
  appointment_id bigint references public.appointments (id) on delete cascade,
  kind           text not null check (kind in (
                   'rdv_confirmation', 'rdv_reminder', 'rdv_rescheduled', 'rdv_cancelled',
                   'rdv_no_show', 'rdv_follow_up', 'contact_auto_reply',
                   'internal_rdv', 'internal_contact')),
  dedupe_key     text not null unique,
  recipient      text not null,
  subject        text not null,
  status         text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_id    text,
  error          text,
  created_at     timestamptz not null default now(),
  sent_at        timestamptz
);

create index email_log_lead_idx on public.email_log (lead_id, created_at desc);
create index email_log_appointment_idx on public.email_log (appointment_id) where appointment_id is not null;

-- ─── Lock down ──────────────────────────────────────────────────────────────

alter table public.leads        enable row level security;
alter table public.appointments enable row level security;
alter table public.email_log    enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;
