"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { useLang } from "@/components/lang-provider";

// Design size of the featured composition (browser + phone), scaled down to fit.
const STAGE_W = 1240;
const STAGE_H = 700;

/**
 * Draws the browser + phone composition at its design size and scales it down to the
 * available width, so the two screens keep their exact layout on a phone. Never scales up.
 * The box reserves its height in CSS (aspect ratio) and the composition stays hidden until
 * it is measured: before hydration, on a slow connection, it would overflow at full size.
 */
function Stage({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / STAGE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="relative w-full" style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}`, maxHeight: STAGE_H }}>
      <div className="absolute left-0 top-0 origin-top-left"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale ?? 0})`, visibility: scale === null ? "hidden" : undefined }}>
        {children}
      </div>
    </div>
  );
}

function Visit({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--rl-red)]">
      {label}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
    </span>
  );
}

export function FunnelCases() {
  const { t } = useLang();
  const f = t.cases.featured;
  return (
    <section id="cas" className="py-20 md:py-28 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--rl-red)]">{t.cases.kicker}</p>
        <h2 className="mt-3 max-w-3xl font-syne text-3xl md:text-[2.75rem] font-bold leading-[1.08] tracking-tight">{t.cases.title}</h2>
        <p className="mt-4 text-[var(--rl-muted)] max-w-2xl md:text-lg">{t.cases.sub}</p>

        {/* Featured: Ahukini, the store built around one gesture. */}
        <Link href={`/realisations/${f.slug}`}
          className="group mt-14 block rounded-3xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-6 md:p-10 transition-colors hover:border-[var(--rl-red)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-red)]">
          <div className="grid gap-6 md:grid-cols-2 md:items-end md:gap-12">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--rl-red)]">{f.sector}</p>
              <h3 className="mt-2 font-syne text-2xl md:text-3xl font-bold leading-tight">{f.name}</h3>
              <p className="mt-3 font-syne text-lg md:text-xl font-semibold leading-snug">{f.title}</p>
            </div>
            <p className="text-[var(--rl-muted)] leading-relaxed">{f.body}</p>
          </div>

          <div className="mt-10" aria-hidden>
            <Stage>
              <div className="rl-browser">
                <div className="rl-chrome"><i /><i /><i /><span>{f.domain}</span></div>
                <div className="rl-browser-view">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tall capture scrolled with a CSS transform */}
                  <img src="/projets/ahukini-accueil-bureau.webp" alt="" decoding="async" />
                </div>
              </div>
              <div className="rl-phone">
                <div className="rl-phone-screen">
                  <div className="rl-notch" />
                  {/* eslint-disable-next-line @next/next/no-img-element -- tall capture scrolled with a CSS transform */}
                  <img src="/projets/ahukini-ensemble-mobile.webp" alt="" decoding="async" />
                </div>
              </div>
            </Stage>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {f.points.map(([title, body]) => (
              <div key={title}>
                <h4 className="font-syne font-semibold">{title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rl-muted)]">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8"><Visit label={t.cases.read} /></div>
        </Link>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {t.cases.items.map((c, i) => {
            // A card with a case page opens it; the others open the live site.
            const page = "slug" in c ? `/realisations/${c.slug}` : null;
            return (
            <motion.a key={c.name} href={page ?? c.url} {...(page ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: (i % 2) * 0.1 }}
              className="group rounded-2xl overflow-hidden bg-[var(--rl-surface)] border border-[var(--rl-line)] flex flex-col transition-colors hover:border-[var(--rl-red)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-red)]">
              <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--rl-line)]">
                <Image src={c.image} alt={`${c.name} : ${c.sector}`} fill sizes="(min-width: 768px) 560px, 100vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
              </div>
              <div className="p-6 md:p-7 flex flex-col flex-1">
                <div className="text-[11px] uppercase tracking-wide text-[var(--rl-red)]">{c.sector}</div>
                <h3 className="mt-2 text-sm font-semibold uppercase tracking-wide">{c.name}</h3>
                <p className="mt-2 font-syne text-xl md:text-2xl font-bold leading-snug">{c.result}</p>
                <p className="mt-3 text-sm text-[var(--rl-muted)] leading-relaxed">{c.summary}</p>
                <p className="mt-5 text-[11px] font-medium uppercase tracking-wide text-[var(--rl-muted)]">{t.cases.changeLabel}</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {c.changes.map((line) => (
                    <li key={line} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rl-red)]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6"><Visit label={page ? t.cases.read : t.cases.visit} /></div>
              </div>
            </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
