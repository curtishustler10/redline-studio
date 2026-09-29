"use client";

// The brand's red thread, alive: it draws itself across the screen, with the
// logo's loop in the middle, and behaves like a string — grab it and it
// stretches, let go and it springs back; brush past it and it vibrates.
//
// Physics runs in a rAF loop that sleeps as soon as the thread is at rest, and
// writes the path directly to the DOM (no React render per frame). Reduced
// motion gets the static thread only.

import { useEffect, useRef } from "react";
import { FIL_PATH } from "@/components/logo";

const HEIGHT = 150;
const POINTS = 140;
const LOOP_SCALE = 3.2; // the 64×32 logo mark, scaled up
const SPRING = 0.045; // pull back to rest shape
const TENSION = 0.32; // neighbours drag each other (string feel)
const DAMPING = 0.9;
const GRAB_RADIUS = 34; // px from the thread to catch it
const MAX_PULL = 95; // px

type Pt = { x: number; y: number };

/** Rest shape for a given width: gentle wave → the logo loop at 62% → wave out. */
function restPath(w: number): string {
  const s = LOOP_SCALE;
  const ox = w * 0.62 - 32 * s;
  const oy = HEIGHT / 2 - 16 * s;
  const tx = (x: number) => (x * s + ox).toFixed(1);
  const ty = (y: number) => (y * s + oy).toFixed(1);
  // Re-express the logo path's coordinates in screen space.
  const loop = FIL_PATH.replace(/^M[^C]+/, "").replace(/(-?\d+(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${tx(+x)} ${ty(+y)}`);
  const startX = +tx(4), startY = +ty(22), endX = +tx(60), endY = +ty(14);
  return [
    `M -12 ${startY + 10}`,
    `C ${(startX * 0.3).toFixed(1)} ${startY - 22}, ${(startX * 0.7).toFixed(1)} ${startY + 20}, ${startX} ${startY}`,
    loop,
    `C ${(endX + (w - endX) * 0.35).toFixed(1)} ${endY - 26}, ${(endX + (w - endX) * 0.7).toFixed(1)} ${endY + 24}, ${w + 12} ${endY + 6}`,
  ].join(" ");
}

function sample(d: string, n: number): Pt[] {
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", d);
  const len = p.getTotalLength();
  return Array.from({ length: n }, (_, i) => {
    const q = p.getPointAtLength((len * i) / (n - 1));
    return { x: q.x, y: q.y };
  });
}

/** Catmull-Rom through the points → smooth cubic path. */
function smooth(pts: Pt[]): string {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}, ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function Fil({ className, onFirstPull }: { className?: string; onFirstPull?: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pulledRef = useRef(false);
  const onPullRef = useRef(onFirstPull);
  onPullRef.current = onFirstPull;

  useEffect(() => {
    const box = boxRef.current!, svg = svgRef.current!, path = pathRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rest: Pt[] = [];
    let off: Pt[] = [];
    let vel: Pt[] = [];
    let width = 0;
    let raf = 0;
    // While held, `pull` is where the grabbed point should be (relative to rest); the step loop enforces it.
    let grab: { i: number; from: Pt; pull: Pt } | null = null;
    let last: { x: number; y: number; t: number } | null = null;

    const draw = () => path.setAttribute("d", smooth(rest.map((p, i) => ({ x: p.x + off[i].x, y: p.y + off[i].y }))));

    const layout = () => {
      width = box.clientWidth;
      svg.setAttribute("viewBox", `0 0 ${width} ${HEIGHT}`);
      const d = restPath(width);
      if (reduced) {
        path.setAttribute("d", d);
        return;
      }
      rest = sample(d, POINTS);
      off = rest.map(() => ({ x: 0, y: 0 }));
      vel = rest.map(() => ({ x: 0, y: 0 }));
      draw();
    };

    const step = () => {
      let energy = 0;
      const n = rest.length;
      const next = off.map((o, i) => {
        if (i === 0 || i === n - 1) return { x: 0, y: 0 }; // ends pinned off-screen
        const a = off[i - 1], b = off[i + 1];
        const fx = -SPRING * o.x + TENSION * ((a.x + b.x) / 2 - o.x);
        const fy = -SPRING * o.y + TENSION * ((a.y + b.y) / 2 - o.y);
        vel[i].x = (vel[i].x + fx) * DAMPING;
        vel[i].y = (vel[i].y + fy) * DAMPING;
        energy += Math.abs(vel[i].x) + Math.abs(vel[i].y) + Math.abs(o.x) * 0.02 + Math.abs(o.y) * 0.02;
        return { x: o.x + vel[i].x, y: o.y + vel[i].y };
      });
      off = next;
      if (grab) {
        const g = grab;
        for (let k = 1; k < n - 1; k++) {
          const w = Math.exp(-((k - g.i) ** 2) / 160);
          off[k] = { x: off[k].x + (g.pull.x * w - off[k].x) * 0.35, y: off[k].y + (g.pull.y * w - off[k].y) * 0.35 };
          vel[k] = { x: vel[k].x * (1 - w), y: vel[k].y * (1 - w) };
        }
      }
      draw();
      raf = grab || energy > 0.05 ? requestAnimationFrame(step) : 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    const local = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * width, y: ((e.clientY - r.top) / r.height) * HEIGHT };
    };
    const nearest = (p: Pt) => {
      let best = 0, dist = Infinity;
      rest.forEach((q, i) => {
        const d = Math.hypot(q.x + off[i].x - p.x, q.y + off[i].y - p.y);
        if (d < dist) (dist = d), (best = i);
      });
      return { i: best, dist };
    };
    const firstPull = () => {
      if (pulledRef.current) return;
      pulledRef.current = true;
      onPullRef.current?.();
    };

    const onDown = (e: PointerEvent) => {
      const p = local(e);
      const { i, dist } = nearest(p);
      if (dist > GRAB_RADIUS) return;
      firstPull();
      if (e.pointerType === "touch") {
        // Touch keeps vertical scrolling: a tap plucks the string instead of holding it.
        for (let k = 0; k < rest.length; k++) vel[k].y += 9 * Math.exp(-((k - i) ** 2) / 90);
        wake();
        return;
      }
      grab = { i, from: p, pull: { x: 0, y: 0 } };
      svg.setPointerCapture(e.pointerId);
      wake();
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      const now = performance.now();
      if (grab) {
        let dx = p.x - grab.from.x, dy = p.y - grab.from.y;
        const m = Math.hypot(dx, dy);
        if (m > MAX_PULL) (dx *= MAX_PULL / m), (dy *= MAX_PULL / m);
        grab.pull = { x: dx, y: dy };
      } else if (last && e.pointerType !== "touch") {
        // Brushing across the thread plucks it, proportional to the pointer's speed.
        const { i, dist } = nearest(p);
        if (dist < 16) {
          const dt = Math.max(now - last.t, 8);
          const vy = Math.max(-40, Math.min(40, ((p.y - last.y) / dt) * 16));
          for (let k = 0; k < rest.length; k++) vel[k].y += vy * 0.35 * Math.exp(-((k - i) ** 2) / 60);
          firstPull();
          wake();
        }
      }
      last = { x: p.x, y: p.y, t: now };
    };
    const onUp = () => {
      grab = null;
      wake();
    };
    const onLeave = () => {
      last = null;
    };

    layout();
    const ro = new ResizeObserver(() => {
      if (box.clientWidth !== width) layout();
    });
    ro.observe(box);
    if (!reduced) {
      svg.addEventListener("pointerdown", onDown);
      svg.addEventListener("pointermove", onMove);
      svg.addEventListener("pointerup", onUp);
      svg.addEventListener("pointercancel", onUp);
      svg.addEventListener("pointerleave", onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("pointercancel", onUp);
      svg.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={boxRef} className={className} aria-hidden>
      <svg ref={svgRef} height={HEIGHT} className="block w-full cursor-grab touch-pan-y select-none overflow-visible active:cursor-grabbing" style={{ height: HEIGHT }}>
        <path
          ref={pathRef}
          fill="none"
          stroke="var(--rl-thread)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="fil-draw"
        />
      </svg>
    </div>
  );
}
