"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";
import {
  BRICK_KEYS,
  QUESTION_COUNT,
  scoreDiagnostic,
  type BrickKey,
  type DiagnosticResult,
  type Zone,
} from "@/lib/diagnostic";

type Phase = "intro" | "quiz" | "result";

const ZONE_BAR: Record<Zone, string> = {
  red: "bg-[var(--rl-red)]",
  warn: "bg-amber-400",
  ok: "bg-emerald-400",
};
const ZONE_TEXT: Record<Zone, string> = {
  red: "text-[var(--rl-red)]",
  warn: "text-amber-400",
  ok: "text-emerald-400",
};

export function FunnelDiagnosticQuiz({ autoStart = false }: { autoStart?: boolean }) {
  const { t, lang } = useLang();
  const q = t.quiz;

  const [phase, setPhase] = useState<Phase>(autoStart ? "quiz" : "intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  function choose(optionIndex: number) {
    const next = [...answers];
    next[step] = optionIndex;
    setAnswers(next);
    if (step + 1 < QUESTION_COUNT) {
      setStep(step + 1);
    } else {
      setResult(scoreDiagnostic(next));
      setPhase("result");
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
    else if (!autoStart) setPhase("intro");
  }

  function restart() {
    setAnswers([]);
    setStep(0);
    setResult(null);
    setPhase(autoStart ? "quiz" : "intro");
  }

  return (
    <div className="mt-10 rounded-2xl border border-[var(--rl-line)] bg-[var(--rl-surface)] p-6 md:p-8">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <Fade key="intro">
            <span className="inline-block text-[11px] tracking-widest uppercase text-[var(--rl-red)]">{q.badge}</span>
            <h3 className="mt-3 font-syne text-2xl md:text-3xl font-bold tracking-tight">{q.title}</h3>
            <p className="mt-2 text-[var(--rl-muted)] max-w-xl">{q.sub}</p>
            <button
              onClick={() => setPhase("quiz")}
              className="mt-6 rounded-full bg-[var(--rl-red)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {q.start}
            </button>
          </Fade>
        )}

        {phase === "quiz" && (
          <Fade key={`q-${step}`}>
            <div className="flex items-center justify-between text-[11px] tracking-widest uppercase text-[var(--rl-muted)]">
              <span>
                {q.progress} {step + 1} {q.of} {QUESTION_COUNT}
              </span>
              <span className="tabular-nums">{Math.round(((step + 1) / QUESTION_COUNT) * 100)}%</span>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-[var(--rl-line)] overflow-hidden">
              <motion.div
                className="h-full bg-[var(--rl-red)]"
                initial={false}
                animate={{ width: `${((step + 1) / QUESTION_COUNT) * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>

            <h3 className="mt-6 font-syne text-xl md:text-2xl font-semibold leading-snug">{q.questions[step].q}</h3>

            <div className="mt-6 space-y-3">
              {q.questions[step].options.map((opt, i) => {
                const selected = answers[step] === i;
                return (
                  <button
                    key={opt}
                    onClick={() => choose(i)}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${
                      selected
                        ? "border-[var(--rl-red)] bg-[var(--rl-red)]/10"
                        : "border-[var(--rl-line)] hover:border-[var(--rl-red)]/50"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                        selected ? "border-[var(--rl-red)] bg-[var(--rl-red)] text-white" : "border-[var(--rl-line)]"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            <button onClick={back} className="mt-6 text-sm text-[var(--rl-muted)] hover:text-[var(--rl-fg)] transition-colors">
              ← {q.back}
            </button>
          </Fade>
        )}

        {phase === "result" && result && (
          <Fade key="result">
            <Result result={result} restart={restart} lang={lang} q={q} />
          </Fade>
        )}
      </AnimatePresence>
    </div>
  );
}

function Result({
  result,
  restart,
  lang,
  q,
}: {
  result: DiagnosticResult;
  restart: () => void;
  lang: string;
  q: ReturnType<typeof useLang>["t"]["quiz"];
}) {
  const weakestName = q.bricks[result.weakest];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-syne text-2xl md:text-3xl font-bold tracking-tight">{q.result.heading}</h3>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-[var(--rl-muted)]">{q.result.scoreLabel}</div>
          <div className="font-syne text-2xl font-bold tabular-nums">{result.totalPct}%</div>
        </div>
      </div>

      {/* weakest brick highlight */}
      <div className="mt-5 rounded-xl border border-[var(--rl-red)] bg-[var(--rl-red)]/10 p-5">
        <div className="text-[11px] uppercase tracking-widest text-[var(--rl-red)]">{q.result.weakestLabel}</div>
        <div className="mt-1 font-syne text-xl font-semibold">{weakestName}</div>
        <p className="mt-1 text-sm text-[var(--rl-muted)]">{q.result.weakestHint}</p>
      </div>

      {/* all bricks scored */}
      <div className="mt-6 space-y-4">
        {orderBricks(result).map((b) => (
          <div key={b.key}>
            <div className="flex justify-between text-sm mb-1.5">
              <span>{q.bricks[b.key]}</span>
              <span className={`text-[11px] uppercase tracking-wide ${ZONE_TEXT[b.zone]}`}>{q.zones[b.zone]}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--rl-line)] overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${ZONE_BAR[b.zone]}`}
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      <LeadForm result={result} weakestName={weakestName} lang={lang} q={q} />

      <button onClick={restart} className="mt-5 text-sm text-[var(--rl-muted)] hover:text-[var(--rl-fg)] transition-colors">
        ↺ {q.result.restart}
      </button>
    </div>
  );
}

function LeadForm({
  result,
  weakestName,
  lang,
  q,
}: {
  result: DiagnosticResult;
  weakestName: string;
  lang: string;
  q: ReturnType<typeof useLang>["t"]["quiz"];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || state === "sending") return;
    setState("sending");
    const breakdown = result.bricks.map((b) => `${q.bricks[b.key]}: ${b.pct}% (${q.zones[b.zone]})`).join(" · ");
    const message = `[Diagnostic ${lang.toUpperCase()}] Score ${result.totalPct}%. ${q.result.weakestLabel}: ${weakestName}. ${breakdown}`;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, service: `Diagnostic — ${weakestName}`, message }),
      });
      if (!res.ok) throw new Error("bad status");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-6 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-5">
        <div className="font-syne text-lg font-semibold">{q.result.successTitle}</div>
        <p className="mt-1 text-sm text-[var(--rl-muted)]">{q.result.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-[var(--rl-line)] p-5">
      <div className="font-syne text-lg font-semibold">{q.result.formTitle}</div>
      <p className="mt-1 text-sm text-[var(--rl-muted)]">{q.result.formSub}</p>
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={q.result.name}
          aria-label={q.result.name}
          required
          className="rounded-lg border border-[var(--rl-line)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--rl-red)]"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={q.result.email}
          aria-label={q.result.email}
          required
          className="rounded-lg border border-[var(--rl-line)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--rl-red)]"
        />
      </div>
      {state === "error" && <p className="mt-3 text-sm text-[var(--rl-red)]">{q.result.error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-4 w-full rounded-full bg-[var(--rl-red)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {state === "sending" ? q.result.sending : q.result.submit}
      </button>
      <p className="mt-3 text-[11px] text-[var(--rl-muted)]">{q.result.privacy}</p>
    </form>
  );
}

function orderBricks(result: DiagnosticResult) {
  const byKey = new Map(result.bricks.map((b) => [b.key, b] as const));
  return BRICK_KEYS.map((k) => byKey.get(k)!).filter(Boolean);
}

function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
