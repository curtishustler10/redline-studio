-- Failed admin logins, counted in Postgres rather than memory: on Vercel each
-- request may land on a different instance, so an in-process counter would reset
-- itself and the lockout would be theatre.

create table public.admin_login_attempts (
  id bigint generated always as identity primary key,
  ip text not null check (length(ip) <= 100),
  at timestamptz not null default now()
);

create index admin_login_attempts_ip_at_idx on public.admin_login_attempts (ip, at desc);

alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from anon, authenticated;
