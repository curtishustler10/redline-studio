-- Redline sells to mainland France: leads with no known zone default to Paris
-- (Curtis's own zone, Pacific/Tahiti, only matters for internal views).
alter table public.leads alter column time_zone set default 'Europe/Paris';
