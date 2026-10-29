// Read-only rendering of a project document, shared by the client editor and the
// admin history. No hooks: renders on the server or the client.
import { groupLines, type DocLine, type DocQuestion, type DocSection } from "@/lib/project-doc";

export function ProposalBadge() {
  return (
    <span className="ml-2 inline-block rounded-full border border-[#C8321F]/40 bg-[var(--rl-surface-2)] px-2 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide text-[var(--rl-red)]">
      proposition
    </span>
  );
}

export function LinesView({ lines }: { lines: DocLine[] }) {
  if (lines.length === 0) return <p className="text-sm italic text-[var(--rl-muted)]">Aucune ligne.</p>;
  return (
    <div className="space-y-3">
      {groupLines(lines).map((g, i) =>
        g.kind === "bullets" ? (
          <ul key={i} className="space-y-2.5">
            {g.lines.map((l) => (
              <li key={l.id} className="relative pl-5 leading-relaxed">
                <span aria-hidden className="absolute left-0 top-[0.7em] h-[2px] w-2.5 rounded bg-[var(--rl-thread)]" />
                {l.text}
                {l.badge === "proposition" && <ProposalBadge />}
              </li>
            ))}
          </ul>
        ) : (
          <div key={i} className="overflow-x-auto rounded-xl bg-[var(--rl-surface-2)]">
            <table className="w-full text-sm tabular-nums">
              <tbody>
                {g.rows.map((cells, r) => (
                  <tr key={r} className={r === 0 ? "font-semibold" : r === g.rows.length - 1 && /^total$/i.test(cells[0] ?? "") ? "border-t border-[var(--rl-line)] font-semibold" : ""}>
                    {cells.map((c, k) => (
                      <td key={k} className={`px-3.5 py-2 ${k === 0 ? "text-left" : "text-right"}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </div>
  );
}

export function QuestionView({ q, n }: { q: DocQuestion; n: number }) {
  return (
    <div>
      <p className="leading-relaxed">
        <span className="mr-2 font-display text-lg text-[var(--rl-thread)]">{n}.</span>
        {q.text}
      </p>
      {q.answer ? (
        <p className="mt-2 whitespace-pre-line rounded-xl bg-[var(--rl-surface-2)] px-3.5 py-2.5 text-sm">{q.answer}</p>
      ) : (
        <p className="mt-2 text-sm italic text-[var(--rl-muted)]">Pas encore de réponse.</p>
      )}
    </div>
  );
}

export function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-baseline gap-3 font-display text-2xl leading-tight sm:text-[1.7rem]">
      <span className="text-base font-sans font-semibold tabular-nums text-[var(--rl-red)]">{String(n).padStart(2, "0")}</span>
      <span>{title}</span>
    </h2>
  );
}

/** Whole document, read-only (admin history). */
export function RecapView({ sections }: { sections: DocSection[] }) {
  return (
    <div className="space-y-5">
      {sections.map((s, i) => (
        <section key={s.id} className="rounded-2xl border border-[var(--rl-line)] bg-[var(--rl-surface)] p-5">
          <SectionHeading n={i + 1} title={s.title} />
          <div className="mt-4">
            {s.kind === "list" ? (
              <LinesView lines={s.lines} />
            ) : (
              <div className="space-y-5">
                {s.questions.map((q, j) => (
                  <QuestionView key={q.id} q={q} n={j + 1} />
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
