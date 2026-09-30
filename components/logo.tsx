import { cn } from "@/lib/utils"

// Brand v2 logo: a red thread drawn in one stroke with a loop in the middle,
// then "redline" (600) + "studio" (400, muted). Always lowercase. The thread
// inherits currentColor from `threadClassName` so it can go white on red.
export const FIL_PATH = "M4 22 C 14 22, 18 8, 26 10 C 34 12, 30 26, 24 22 C 18 18, 30 6, 40 12 C 48 17, 54 20, 60 14"

/**
 * The logo loop placed on a canvas: scaled by `s` and offset so its 64×32 box
 * starts at (ox, oy). Returns the curve segments (no leading M) and the
 * endpoints, so a longer thread can run into and out of it.
 */
export function placeFil(s: number, ox: number, oy: number) {
  const tx = (x: number) => +(x * s + ox).toFixed(1)
  const ty = (y: number) => +(y * s + oy).toFixed(1)
  const curves = FIL_PATH.replace(/^M[^C]+/, "").replace(/(-?\d+(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${tx(+x)} ${ty(+y)}`)
  return { curves, start: { x: tx(4), y: ty(22) }, end: { x: tx(60), y: ty(14) } }
}

export function Logo({ className, threadClassName }: { className?: string; threadClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.35em] whitespace-nowrap leading-none tracking-tight", className)}>
      <svg viewBox="0 0 64 32" aria-hidden className={cn("h-[1.15em] w-[2.3em] shrink-0 text-[var(--rl-thread)]", threadClassName)}>
        <path d={FIL_PATH} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>
        <span className="font-semibold">redline</span> <span className="font-normal text-[var(--rl-muted)]">studio</span>
      </span>
    </span>
  )
}
