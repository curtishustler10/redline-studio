"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/components/lang-provider";

export function FunnelCases() {
  const { t } = useLang();
  return (
    <section id="cas" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.cases.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.cases.sub}</p>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {t.cases.items.map((c, i) => (
            <motion.a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: (i % 2) * 0.1 }}
              className="group rounded-2xl overflow-hidden bg-[var(--rl-surface)] border border-[var(--rl-line)] flex flex-col transition-colors hover:border-[var(--rl-red)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-red)]">
              <div className="relative aspect-[16/10] overflow-hidden border-b border-[var(--rl-line)]">
                <Image src={c.image} alt={`${c.name} : ${c.sector}`} fill sizes="(min-width: 768px) 480px, 100vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="text-[11px] uppercase tracking-wide text-[var(--rl-red)]">{c.sector}</div>
                <h3 className="mt-2 font-syne text-xl font-semibold">{c.name}</h3>
                <p className="mt-3 text-sm text-[var(--rl-muted)] leading-relaxed">{c.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {c.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-[var(--rl-line)] px-3 py-1 text-xs">{tag}</li>
                  ))}
                </ul>
                <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--rl-red)]">
                  {t.cases.visit}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
