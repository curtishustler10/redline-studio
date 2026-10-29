import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon projet · Redline Studio",
  // Private client space on a public domain: never indexed.
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--rl-bg)] text-[var(--rl-ink)]">{children}</div>;
}
