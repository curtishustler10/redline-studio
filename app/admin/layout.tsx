import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Redline Studio",
  // Internal tool on a public domain: never indexed, never followed.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FBF6EE] text-[#1E1A17] font-sans">{children}</div>;
}
