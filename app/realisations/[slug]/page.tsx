import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { caseStudies, getCaseStudy, type Shot } from "@/lib/cases";
import { WHATSAPP_HREF } from "@/lib/constants";

// Same layout idea as the Fenua case pages: a header card, then a sticky table of
// contents on the left and the article on the right. French only (lib/cases.ts).

const AUDIT_HREF = `mailto:hello@redlinestudio.agency?subject=${encodeURIComponent("Audit offert")}`;

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const study = getCaseStudy(params.slug);
  if (!study) return {};
  const title = `${study.headline} · étude de cas ${study.name}`;
  return {
    title: `${title} · Redline Studio`,
    description: study.summary,
    alternates: { canonical: `/realisations/${study.slug}` },
    openGraph: { title, description: study.summary, type: "article", locale: "fr_FR", url: `/realisations/${study.slug}` },
  };
}

const h2 = "scroll-mt-24 font-syne text-2xl md:text-[28px] font-bold tracking-tight";
const para = "mt-4 text-[17px] leading-[1.75] text-[var(--rl-muted)]";

/** Desktop captures take the article width; phone captures sit side by side, narrow. */
function Shots({ shots }: { shots: Shot[] }) {
  if (!shots.length) return null;
  const desk = shots.filter((s) => s.width > s.height);
  const phone = shots.filter((s) => s.width <= s.height);
  return (
    <div className="mt-6 space-y-6">
      {desk.map((s) => (
        <Image key={s.src} src={s.src} alt={s.alt} width={s.width} height={s.height} sizes="(min-width: 1024px) 760px, 100vw"
          className="w-full h-auto rounded-2xl border border-[var(--rl-line)] bg-white" />
      ))}
      {phone.length ? (
        <div className="flex flex-wrap justify-center gap-6">
          {phone.map((s) => (
            <Image key={s.src} src={s.src} alt={s.alt} width={s.width} height={s.height} sizes="260px"
              className="w-full max-w-[260px] h-auto rounded-[28px] border-[6px] border-[var(--rl-ink)] bg-white" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CasePage({ params }: { params: { slug: string } }) {
  const study = getCaseStudy(params.slug);
  if (!study) notFound();

  const index = caseStudies.indexOf(study);
  const next = caseStudies[(index + 1) % caseStudies.length];
  const toc = [
    { id: "point-de-depart", label: "Le point de départ" },
    ...(study.beforeAfter ? [{ id: "avant-apres", label: study.beforeAfter.title }] : []),
    { id: "ce-que-nous-avons-construit", label: "Ce que nous avons construit" },
    { id: "ce-que-ca-change", label: "Ce que ça change" },
    { id: "methode", label: "Comment nous avons travaillé" },
    { id: "votre-projet", label: "Le même problème chez vous ?" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 backdrop-blur bg-[#FBF6EE]/85 border-b border-[var(--rl-line)]">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Redline Studio, accueil"><Logo className="text-sm" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/#cas" className="hidden sm:inline text-[12px] text-[var(--rl-muted)] hover:text-[var(--rl-ink)]">Toutes les réalisations</Link>
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="text-[12px] px-3.5 py-1.5 rounded-full bg-[var(--rl-ink)] text-[var(--rl-bg)] font-medium hover:bg-[var(--rl-red)] transition-colors">
              Réserver un appel
            </a>
          </div>
        </div>
      </header>

      <main>
        <div className="p-2 sm:p-3">
          <div className="rounded-[28px] border border-[var(--rl-line)] bg-[var(--rl-surface-2)] px-6 pb-10 pt-8 sm:px-10 md:pb-14 md:pt-12">
            <div className="mx-auto max-w-6xl">
              <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--rl-muted)]">
                <Link href="/" className="hover:text-[var(--rl-ink)]">Accueil</Link>
                <span aria-hidden>/</span>
                <Link href="/#cas" className="hover:text-[var(--rl-ink)]">Réalisations</Link>
                <span aria-hidden>/</span>
                <span className="text-[var(--rl-ink)]">{study.name}</span>
              </nav>
              <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--rl-red)]">{study.sector}</p>
              <h1 className="mt-3 max-w-4xl text-balance font-syne text-[34px] md:text-5xl font-bold leading-[1.1] tracking-tight">
                {study.headline}
                <span className="text-[var(--rl-red)]">{" "}: étude de cas {study.name}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--rl-muted)]">{study.summary}</p>
              <a href={study.liveUrl} target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--rl-red)] hover:underline underline-offset-4">
                Voir le site en ligne <ArrowUpRight className="h-4 w-4" aria-hidden />
                <span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-8 sm:px-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14 lg:pt-12">
          <aside className="hidden lg:block">
            <nav aria-label="Sommaire" className="sticky top-24">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--rl-muted)]">Sommaire</p>
              <ul className="mt-4 space-y-3 text-[15px] leading-snug text-[var(--rl-muted)]">
                {toc.map((t) => (
                  <li key={t.id}><a href={`#${t.id}`} className="hover:text-[var(--rl-red)]">{t.label}</a></li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="min-w-0 max-w-[760px]">
            <h2 id="point-de-depart" className={h2}>Le point de départ</h2>
            <p className={para}>{study.problem}</p>

            {study.beforeAfter ? (
              <section aria-labelledby="avant-apres">
                <h2 id="avant-apres" className={`${h2} mt-14`}>{study.beforeAfter.title}</h2>
                <p className={para}>{study.beforeAfter.intro}</p>
                <div className="mt-6 space-y-8">
                  {[study.beforeAfter.before, study.beforeAfter.after].map((side) => (
                    <figure key={side.label}>
                      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-[var(--rl-red)]">{side.label}</p>
                      <Image src={side.shot.src} alt={side.shot.alt} width={side.shot.width} height={side.shot.height}
                        sizes="(min-width: 1024px) 760px, 100vw" className="w-full h-auto rounded-2xl border border-[var(--rl-line)] bg-white" />
                      <figcaption className="mt-3 text-[15px] leading-relaxed text-[var(--rl-muted)]">{side.caption}</figcaption>
                    </figure>
                  ))}
                </div>
                {study.beforeAfter.note ? <p className="mt-4 text-sm text-[var(--rl-muted)]">{study.beforeAfter.note}</p> : null}
              </section>
            ) : null}

            <h2 id="ce-que-nous-avons-construit" className={`${h2} mt-14`}>Ce que nous avons construit</h2>
            <p className={para}>{study.solution}</p>
            <div className="mt-10 space-y-14">
              {study.features.map((f, i) => (
                <section key={f.title}>
                  <h3 className="font-syne text-xl font-semibold">
                    <span className="mr-2 text-[var(--rl-red)]">{String(i + 1).padStart(2, "0")}</span>{f.title}
                  </h3>
                  <p className="mt-3 text-[17px] leading-[1.75]">{f.what}</p>
                  <p className="mt-2 border-l-2 border-[var(--rl-red)] pl-3 text-[15px] leading-relaxed text-[var(--rl-muted)]">
                    <span className="font-medium text-[var(--rl-ink)]">Pourquoi : </span>{f.why}
                  </p>
                  <Shots shots={f.shots} />
                </section>
              ))}
            </div>

            <h2 id="ce-que-ca-change" className={`${h2} mt-16`}>Ce que ça change</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {study.outcomes.map((o) => (
                <div key={o.value} className="rounded-2xl border border-[var(--rl-line)] bg-[var(--rl-surface)] p-6">
                  <p className="font-syne text-lg font-bold leading-snug">{o.value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--rl-muted)]">{o.label}</p>
                </div>
              ))}
            </div>

            <h2 id="methode" className={`${h2} mt-16`}>Comment nous avons travaillé</h2>
            <dl className="mt-6 divide-y divide-[var(--rl-line)] border-y border-[var(--rl-line)]">
              {study.method.map((m) => (
                <div key={m.label} className="grid gap-1 py-4 sm:grid-cols-[200px_1fr] sm:gap-6">
                  <dt className="text-sm font-medium">{m.label}</dt>
                  <dd className="text-sm leading-relaxed text-[var(--rl-muted)]">{m.value}</dd>
                </div>
              ))}
            </dl>

            <aside id="votre-projet" className="mt-16 scroll-mt-24 rounded-3xl bg-[var(--rl-ink)] p-7 text-[var(--rl-bg)] md:p-10">
              <h2 className="font-syne text-2xl font-bold">Le même problème chez vous ?</h2>
              <p className="mt-3 max-w-xl leading-relaxed opacity-80">
                Nous partons toujours de l&apos;endroit précis où vous perdez des clients. L&apos;audit est offert : vous le recevez sous 48 h, que vous travailliez avec nous ou non.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={AUDIT_HREF} className="rounded-full bg-[var(--rl-red)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--rl-red-hover)]">
                  Demander l&apos;audit offert
                </a>
                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer"
                  className="rounded-full border border-white/25 px-6 py-3 transition-colors hover:border-white">
                  Réserver un appel
                </a>
              </div>
            </aside>

            <nav aria-label="Projets" className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rl-line)] pt-8 text-sm">
              <Link href="/#cas" className="inline-flex items-center gap-1 text-[var(--rl-muted)] hover:text-[var(--rl-ink)]">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Toutes les réalisations
              </Link>
              <Link href={`/realisations/${next.slug}`} className="inline-flex items-center gap-1 font-medium text-[var(--rl-red)]">
                Projet suivant : {next.name} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </nav>
          </article>
        </div>
      </main>

      <footer className="border-t border-[var(--rl-line)] py-10">
        <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[var(--rl-muted)]">
          <Logo className="text-sm text-[var(--rl-ink)]" />
          <p>Le fil rouge entre vous et vos clients.</p>
          <p>© {new Date().getFullYear()} Redline Studio. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
