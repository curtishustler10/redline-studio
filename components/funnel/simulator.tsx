"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-provider";
import type { Lang } from "@/lib/i18n";
import { computeComparison, type SimInputs } from "@/lib/simulator";

const locale = (lang: Lang) => (lang === "en" ? "en-GB" : "fr-FR");
const num = (n: number, lang: Lang) => n.toLocaleString(locale(lang));
const euro = (n: number, lang: Lang) =>
  new Intl.NumberFormat(locale(lang), { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const FIELDS: { key: keyof SimInputs; min: number; max: number; step: number; suffix: string }[] = [
  { key: "visitors", min: 100, max: 50000, step: 100, suffix: "" },
  { key: "capturePct", min: 0, max: 40, step: 1, suffix: "%" },
  { key: "conversionPct", min: 0, max: 15, step: 1, suffix: "%" },
  { key: "basket", min: 10, max: 500, step: 5, suffix: "€" },
  { key: "frequency", min: 1, max: 12, step: 1, suffix: "x" },
  { key: "retentionPct", min: 0, max: 80, step: 1, suffix: "%" },
];

const LABEL_KEY: Record<keyof SimInputs, "visitors" | "capture" | "conversion" | "basket" | "frequency" | "retention"> = {
  visitors: "visitors", capturePct: "capture", conversionPct: "conversion",
  basket: "basket", frequency: "frequency", retentionPct: "retention",
};

export function FunnelSimulator() {
  const { t, lang } = useLang();
  const [inputs, setInputs] = useState<SimInputs>({
    visitors: 10000, capturePct: 10, conversionPct: 5, basket: 80, frequency: 2, retentionPct: 30,
  });
  const { siteOnly, ecosystem } = computeComparison(inputs);

  const set = (key: keyof SimInputs, v: number) => setInputs((p) => ({ ...p, [key]: v }));

  return (
    <section id="simulateur" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.simulator.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.simulator.sub}</p>

        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          {/* sliders */}
          <div className="space-y-7">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--rl-muted)]">{t.simulator.inputs[LABEL_KEY[f.key]]}</span>
                  <span className="font-medium tabular-nums">
                    {num(inputs[f.key], lang)}{f.suffix}
                  </span>
                </div>
                <Slider value={[inputs[f.key]]} min={f.min} max={f.max} step={f.step}
                  onValueChange={([v]) => set(f.key, v)} />
              </div>
            ))}
          </div>

          {/* outputs + comparison */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Stat label={t.simulator.outputs.leads} value={num(ecosystem.leads, lang)} />
              <Stat label={t.simulator.outputs.clients} value={num(ecosystem.clients, lang)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Compare title={t.simulator.compareSite} monthly={euro(siteOnly.monthly, lang)} yearly={euro(siteOnly.yearly, lang)}
                monthlyLabel={t.simulator.outputs.monthly} yearlyLabel={t.simulator.outputs.yearly} dim />
              <Compare title={t.simulator.compareEco} monthly={euro(ecosystem.monthly, lang)} yearly={euro(ecosystem.yearly, lang)}
                monthlyLabel={t.simulator.outputs.monthly} yearlyLabel={t.simulator.outputs.yearly} />
            </div>
            <p className="text-[11px] text-[var(--rl-muted)]">{t.simulator.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-4">
      <div className="text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">{label}</div>
      <div className="mt-1 font-syne text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Compare({ title, monthly, yearly, monthlyLabel, yearlyLabel, dim }: {
  title: string; monthly: string; yearly: string; monthlyLabel: string; yearlyLabel: string; dim?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 border ${dim ? "border-[var(--rl-line)] bg-transparent" : "border-[var(--rl-red)] bg-[var(--rl-red)]/10"}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{dim ? "❌" : "✅"}</span>{title}
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">{monthlyLabel}</div>
      <div className="font-syne text-2xl font-bold tabular-nums">{monthly}</div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">{yearlyLabel}</div>
      <div className="font-syne text-lg font-semibold tabular-nums">{yearly}</div>
    </div>
  );
}
