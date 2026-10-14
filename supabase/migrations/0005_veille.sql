-- Veille e-commerce : les boutiques chez qui la boîte de veille s'est inscrite, a rempli un
-- panier et abandonné un checkout, avec la fiche du lead, les workflows email identifiés,
-- les emails reçus et l'offre adaptée. Alimenté par la machine de Curtis
-- (/home/x/projects/redline-veille, scripts/sync.mjs) via POST /api/veille/sync ; lu par
-- /admin/veille. Ces prospects ne sont PAS des leads du CRM (table leads) : ils ne nous ont
-- rien demandé, on les étudie avant de les contacter.

create table public.veille_leads (
  slug              text primary key check (slug ~ '^[a-z0-9-]{1,60}$'),
  marque            text not null check (length(marque) <= 200),
  domaine           text not null check (length(domaine) <= 200),
  plateforme        text check (length(plateforme) <= 60),
  source            text check (length(source) <= 500),
  j0                date,
  statut            text not null default 'j0-en-cours' check (length(statut) <= 40),
  score             smallint check (score between 0 and 100),
  classe            text check (classe in ('A', 'B', 'C')),
  -- 'oui' magasin ouvert au public vérifié · 'showroom' · 'non' · null = pas encore vérifié
  boutique_physique text check (boutique_physique in ('oui', 'showroom', 'non')),
  -- Parcours J0 : { inscription, panier, checkout, desinscription } → { at, fait, detail }
  etapes            jsonb not null default '{}'::jsonb,
  -- Brief du lead : site, pixel, outils, réseaux sociaux, constats (voir lib/veille.ts)
  fiche             jsonb not null default '{}'::jsonb,
  -- Workflows identifiés : [{ sequence, verdict, emails, premierDelai, notes }]
  workflows         jsonb not null default '[]'::jsonb,
  -- Offre adaptée : { code, titre, pourquoi, option, provisoire }
  offre             jsonb,
  -- Brief de contact (markdown de leads/<slug>/brief.md), null avant l'analyse J7
  brief_md          text check (length(brief_md) <= 50000),
  -- Journal daté des actions : [{ at, etape, fait, resultat, captures[] }]
  journal           jsonb not null default '[]'::jsonb,
  synced_at         timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index veille_leads_j0_idx on public.veille_leads (j0 desc);

create trigger veille_leads_touch before update on public.veille_leads
  for each row execute function public.touch_updated_at();

create table public.veille_emails (
  -- Identifiant Gmail du message (hexadécimal) : stable, rend la synchro idempotente.
  id            text primary key check (id ~ '^[0-9a-f]{8,24}$'),
  slug          text not null references public.veille_leads (slug) on delete cascade,
  recu_at       timestamptz not null,
  objet         text not null check (length(objet) <= 500),
  expediteur    text check (length(expediteur) <= 300),
  pre_entete    text check (length(pre_entete) <= 500),
  outil         text check (length(outil) <= 200),
  delai         text check (length(delai) <= 200),
  -- 'bienvenue' | 'checkout' | 'newsletter' | 'transactionnel' | 'autre' (classé à la collecte, revu à J7)
  sequence      text check (sequence in ('bienvenue', 'checkout', 'newsletter', 'transactionnel', 'autre')),
  texte         text check (length(texte) <= 8000),
  mobile_path   text check (length(mobile_path) <= 300),
  desktop_path  text check (length(desktop_path) <= 300),
  created_at    timestamptz not null default now()
);

create index veille_emails_slug_idx on public.veille_emails (slug, recu_at);

alter table public.veille_leads  enable row level security;
alter table public.veille_emails enable row level security;
revoke all on public.veille_leads  from anon, authenticated;
revoke all on public.veille_emails from anon, authenticated;

-- Captures (boutique et rendu des emails) : bucket privé, lu par l'admin en URLs signées.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('veille', 'veille', false, 4194304, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;
