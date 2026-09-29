-- Curtis can only be in one meeting at a time. With the public booking page two
-- leads may race for the same slot (or a lead and Curtis setting one by hand):
-- the database, not the app, is what makes a double booking impossible.
--
-- ends_at is maintained by trigger rather than a generated column because
-- timestamptz + interval is only STABLE, and generated/indexed expressions must
-- be IMMUTABLE.

create extension if not exists btree_gist with schema extensions;

alter table public.appointments add column ends_at timestamptz;

create or replace function public.set_appointment_end()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.ends_at := new.starts_at + make_interval(mins => new.duration_min);
  return new;
end;
$$;

create trigger appointments_set_end before insert or update of starts_at, duration_min on public.appointments
  for each row execute function public.set_appointment_end();

update public.appointments set ends_at = starts_at + make_interval(mins => duration_min);
alter table public.appointments alter column ends_at set not null;

-- Only upcoming RDVs block the calendar; cancelled / done / no-show ones do not.
alter table public.appointments add constraint appointments_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at) with &&) where (status = 'scheduled');

revoke all on function public.set_appointment_end() from anon, authenticated, public;
