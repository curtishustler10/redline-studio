"use client";

// The red thread, continued: it runs down the left margin, bending at each
// section, and draws itself as the visitor scrolls. At the closing card it
// swings to the centre and ties the logo loop above the final call to action.
//
// Wide screens only (the margin is too narrow below 1280 px, the thread would
// cross the copy). Reduced motion gets it fully drawn. Geometry is rebuilt when
// the page's height changes (e.g. the quiz opening in the hero).

import { useEffect, useRef } from "react";
import { placeFil } from "@/components/logo";

const MIN_WIDTH = 1280;
const CONTENT_MAX = 1152; // max-w-6xl
const WAYPOINTS = ["diagnostic", "briques", "simulateur", "cas", "livrables", "methode"];
const FINALE = "closing";
const KNOT_SCALE = 1.7;

type Pt = { x: number; y: number };

function build(root: HTMLElement): { d: string; startY: number } | null {
  const base = root.getBoundingClientRect();
  const top = (id: string) => {
    const el = document.getElementById(id);
    return el ? el.getBoundingClientRect().top - base.top : null;
  };
  const gutter = Math.max(20, (root.clientWidth - CONTENT_MAX) / 2 - 30);
  const hero = document.getElementById("bienvenue");
  const card = document.getElementById(FINALE);
  if (!hero || !card) return null;

  const pts: Pt[] = [{ x: gutter, y: hero.getBoundingClientRect().bottom - base.top - 60 }];
  WAYPOINTS.forEach((id, i) => {
    const y = top(id);
    if (y !== null) pts.push({ x: gutter + (i % 2 ? 14 : -14), y: y + 90 });
  });

  // Stay in the margin down to the section holding the card, then swing to the
  // centre only in the empty band above it (never across the copy), into the
  // logo loop — its loop (x≈26 in the 64-wide mark) centred over the title.
  const cardRect = card.getBoundingClientRect();
  const cx = cardRect.left - base.left + cardRect.width / 2;
  const cardTop = cardRect.top - base.top;
  const sectionTop = (card.closest("section")?.getBoundingClientRect().top ?? cardRect.top - 80) - base.top;
  pts.push({ x: gutter, y: sectionTop + 12 });
  const knot = placeFil(KNOT_SCALE, cx - 26 * KNOT_SCALE, cardTop - 16 * KNOT_SCALE - 30);

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], mid = (a.y + b.y) / 2;
    d += ` C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`;
  }
  const last = pts[pts.length - 1];
  d += ` C ${last.x + 40} ${knot.start.y}, ${knot.start.x - 160} ${knot.start.y + 4}, ${knot.start.x} ${knot.start.y}`;
  d += ` ${knot.curves}`;
  return { d, startY: pts[0].y };
}

export function ScrollThread() {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const box = boxRef.current!, svg = svgRef.current!, path = pathRef.current!;
    const root = box.parentElement!;
    const wide = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // length ↔ y lookup: the path is mostly vertical, so "how far has the visitor
    // read" maps to "how much thread is drawn" through the y of each sample.
    let table: { len: number; y: number }[] = [];
    let total = 1;
    let frame = 0;

    const progress = () => {
      frame = 0;
      if (reduced || !table.length) {
        path.style.strokeDashoffset = "0";
        return;
      }
      const reading = window.scrollY + window.innerHeight * 0.7 - (root.getBoundingClientRect().top + window.scrollY);
      let len = 0;
      for (const s of table) {
        if (s.y > reading) break;
        len = s.len;
      }
      path.style.strokeDashoffset = String(1 - len / total);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(progress);
    };

    const layout = () => {
      if (!wide.matches) {
        svg.style.display = "none";
        return;
      }
      const geo = build(root);
      if (!geo) return;
      svg.style.display = "block";
      svg.setAttribute("viewBox", `0 0 ${root.clientWidth} ${root.scrollHeight}`);
      svg.setAttribute("height", String(root.scrollHeight));
      path.setAttribute("d", geo.d);
      total = path.getTotalLength();
      table = [];
      let maxY = -Infinity;
      for (let i = 0; i <= 600; i++) {
        const len = (total * i) / 600;
        // Monotonic y so the loop's back-and-forth does not confuse the lookup.
        maxY = Math.max(maxY, path.getPointAtLength(len).y);
        table.push({ len, y: maxY });
      }
      progress();
    };

    layout();
    const ro = new ResizeObserver(() => layout());
    ro.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    wide.addEventListener("change", layout);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      wide.removeEventListener("change", layout);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={boxRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg ref={svgRef} width="100%" className="absolute left-0 top-0" style={{ display: "none" }}>
        <path
          ref={pathRef}
          fill="none"
          stroke="var(--rl-thread)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
        />
      </svg>
    </div>
  );
}
