-- "Mon projet" can host a project for a partner studio: Ergoligne is a Fenua
-- Studio client, served from this site and database but shown entirely in Fenua
-- Studio's brand (fonts, colours, header, footer, title, icon, login form at
-- /portal/<slug>). 'redline' is the default, so existing projects do not change.
-- contact_name is the person the space greets (« Bonjour Carline »); optional.
-- Additive only: two columns with defaults, no data rewritten.

alter table public.client_projects
  add column brand text not null default 'redline' check (brand in ('redline', 'fenua')),
  add column contact_name text check (contact_name is null or length(trim(contact_name)) between 1 and 200);
