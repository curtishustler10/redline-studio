-- "Mon projet" email previews: images shown in a client's space (e.g. Ahukini's
-- "Aperçus des e-mails"). Private bucket, objects at <project slug>/<id>.webp,
-- read only by the server (service_role) and streamed to a valid project session
-- by app/portal/[slug]/apercus/[image]. No storage policy: anon and
-- authenticated cannot list, read or write it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portal', 'portal', false, 2097152, array['image/webp'])
on conflict (id) do nothing;
