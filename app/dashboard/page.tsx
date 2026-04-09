"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw, LogOut, Mail, Clock, CheckCircle2, XCircle, ChevronDown } from "lucide-react"

type LeadStatus = "new" | "contacted" | "closed"

type Lead = {
  id: string
  name: string
  email: string
  service: string
  message: string
  createdAt: string
  status: LeadStatus
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-[#C41F1F]/10 text-[#C41F1F] border-[#C41F1F]/30",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const STATUS_ICONS: Record<LeadStatus, React.ReactNode> = {
  new: <Mail className="w-3 h-3" />,
  contacted: <Clock className="w-3 h-3" />,
  closed: <CheckCircle2 className="w-3 h-3" />,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate({ onAuth }: { onAuth: (pwd: string) => void }) {
  const [pwd, setPwd] = useState("")
  const [err, setErr] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pwd.trim()) { setErr(false); onAuth(pwd.trim()) }
    else setErr(true)
  }

  return (
    <div className="min-h-screen bg-[#F2EAD3] flex items-center justify-center">
      <div className="w-[320px] border border-[#D4C9B0] p-10">
        <div className="flex items-baseline gap-0.5 mb-8">
          <span className="font-cormorant italic font-light text-2xl text-[#9A8F7A]">Red</span>
          <span className="font-syne text-base font-bold text-[#1C1714] tracking-[0.15em] uppercase">LINE</span>
          <span className="font-cormorant text-2xl text-[#C41F1F]">.</span>
        </div>
        <p className="font-syne text-[11px] tracking-[0.2em] uppercase text-[#9A8F7A] mb-6">Dashboard</p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-b border-[#D4C9B0] focus:border-[#C41F1F] outline-none font-syne text-[13px] text-[#1C1714] placeholder-[#C0B8A8] py-2 transition-colors"
          />
          {err && <p className="font-syne text-[11px] text-[#C41F1F]">Incorrect password</p>}
          <button
            type="submit"
            className="bg-[#C41F1F] text-[#F2EAD3] font-syne text-[11px] tracking-[0.25em] uppercase py-3 hover:bg-[#A01818] transition-colors mt-1"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [pwd, setPwd] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<LeadStatus | "all">("all")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"leads" | "bot">("leads")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem("rl_dash_pwd")
    if (saved) setPwd(saved)
  }, [])

  const fetchLeads = useCallback(async (password: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads?pwd=${encodeURIComponent(password)}`)
      if (res.status === 401) { setAuthError(true); setPwd(null); sessionStorage.removeItem("rl_dash_pwd"); return }
      setAuthError(false)
      setLeads(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pwd) fetchLeads(pwd)
  }, [pwd, fetchLeads])

  function handleAuth(password: string) {
    sessionStorage.setItem("rl_dash_pwd", password)
    setPwd(password)
  }

  async function updateStatus(id: string, status: LeadStatus) {
    if (!pwd) return
    await fetch(`/api/leads/${id}?pwd=${encodeURIComponent(pwd)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
  }

  if (!pwd) return <AuthGate onAuth={handleAuth} />

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter)
  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    closed: leads.filter((l) => l.status === "closed").length,
  }

  return (
    <div className="min-h-screen bg-[#F2EAD3] font-syne">
      {/* Top bar */}
      <div className="border-b border-[#D4C9B0] px-8 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-0.5">
          <span className="font-cormorant italic font-light text-xl text-[#9A8F7A]">Red</span>
          <span className="font-syne text-sm font-bold text-[#1C1714] tracking-[0.15em] uppercase">LINE</span>
          <span className="font-cormorant text-xl text-[#C41F1F]">.</span>
          <span className="font-syne text-[10px] tracking-[0.25em] uppercase text-[#9A8F7A] ml-3">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchLeads(pwd)}
            disabled={loading}
            className="flex items-center gap-1.5 font-syne text-[10px] tracking-[0.2em] uppercase text-[#9A8F7A] hover:text-[#1C1714] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => { sessionStorage.removeItem("rl_dash_pwd"); setPwd(null) }}
            className="flex items-center gap-1.5 font-syne text-[10px] tracking-[0.2em] uppercase text-[#9A8F7A] hover:text-[#C41F1F] transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-8 border-b border-[#D4C9B0] mb-8">
          {(["leads", "bot"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-syne text-[11px] tracking-[0.2em] uppercase pb-3 border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#C41F1F] text-[#1C1714]"
                  : "border-transparent text-[#9A8F7A] hover:text-[#1C1714]"
              }`}
            >
              {tab === "leads" ? `Leads (${counts.all})` : "Bot Settings"}
            </button>
          ))}
        </div>

        {/* ── LEADS TAB ── */}
        {activeTab === "leads" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {(["all", "new", "contacted", "closed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`border p-5 text-left transition-all ${
                    filter === s
                      ? "border-[#C41F1F] bg-[#C41F1F]/5"
                      : "border-[#D4C9B0] hover:border-[#9A8F7A]"
                  }`}
                >
                  <div className="font-cormorant text-3xl text-[#1C1714] leading-none mb-1">{counts[s]}</div>
                  <div className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A] capitalize">{s === "all" ? "Total" : s}</div>
                </button>
              ))}
            </div>

            {/* Leads list */}
            {filtered.length === 0 ? (
              <div className="border border-[#D4C9B0] py-16 text-center">
                <p className="font-cormorant text-2xl text-[#C0B8A8]">No leads yet.</p>
                <p className="font-syne text-[11px] text-[#C0B8A8] mt-2">They&apos;ll appear here when visitors use the chat widget.</p>
              </div>
            ) : (
              <div className="border border-[#D4C9B0]">
                {filtered.map((lead, i) => (
                  <div key={lead.id} className={`${i !== 0 ? "border-t border-[#D4C9B0]" : ""}`}>
                    {/* Row */}
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#EDE4CC]/40 transition-colors"
                      onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`flex items-center gap-1.5 border px-2 py-0.5 text-[9px] tracking-[0.15em] uppercase font-syne flex-shrink-0 ${STATUS_COLORS[lead.status]}`}>
                          {STATUS_ICONS[lead.status]}
                          {lead.status}
                        </span>
                        <span className="font-cormorant text-lg text-[#1C1714] truncate">{lead.name}</span>
                        <span className="font-syne text-[11px] text-[#9A8F7A] truncate hidden sm:block">{lead.email}</span>
                        {lead.service && (
                          <span className="font-syne text-[9px] tracking-[0.1em] uppercase text-[#C0B8A8] border border-[#D4C9B0] px-2 py-0.5 hidden md:block">{lead.service}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="font-syne text-[10px] text-[#C0B8A8] hidden lg:block">{formatDate(lead.createdAt)}</span>
                        <ChevronDown className={`w-4 h-4 text-[#C0B8A8] transition-transform ${expandedId === lead.id ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Expanded */}
                    {expandedId === lead.id && (
                      <div className="px-5 pb-5 bg-[#EDE4CC]/30 border-t border-[#D4C9B0]">
                        <div className="grid grid-cols-2 gap-4 pt-4 mb-4">
                          <div>
                            <p className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A] mb-1">Email</p>
                            <a href={`mailto:${lead.email}`} className="font-syne text-[12px] text-[#C41F1F] hover:underline">{lead.email}</a>
                          </div>
                          <div>
                            <p className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A] mb-1">Service</p>
                            <p className="font-syne text-[12px] text-[#1C1714]">{lead.service || "—"}</p>
                          </div>
                          <div>
                            <p className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A] mb-1">Received</p>
                            <p className="font-syne text-[12px] text-[#1C1714]">{formatDate(lead.createdAt)}</p>
                          </div>
                        </div>
                        {lead.message && (
                          <div className="mb-4">
                            <p className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A] mb-1">Message</p>
                            <p className="font-syne text-[12px] text-[#1C1714] leading-relaxed">{lead.message}</p>
                          </div>
                        )}
                        {/* Status actions */}
                        <div className="flex items-center gap-3 pt-2">
                          <span className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A]">Move to:</span>
                          {(["new", "contacted", "closed"] as LeadStatus[]).filter((s) => s !== lead.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(lead.id, s)}
                              className="flex items-center gap-1.5 font-syne text-[9px] tracking-[0.15em] uppercase border border-[#D4C9B0] px-3 py-1.5 hover:border-[#9A8F7A] text-[#9A8F7A] hover:text-[#1C1714] transition-colors capitalize"
                            >
                              {STATUS_ICONS[s]} {s}
                            </button>
                          ))}
                          <a
                            href={`mailto:${lead.email}`}
                            className="ml-auto flex items-center gap-1.5 font-syne text-[9px] tracking-[0.15em] uppercase border border-[#C41F1F] px-3 py-1.5 text-[#C41F1F] hover:bg-[#C41F1F] hover:text-[#F2EAD3] transition-colors"
                          >
                            <Mail className="w-3 h-3" /> Email
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BOT TAB ── */}
        {activeTab === "bot" && (
          <div className="max-w-xl">
            <p className="font-cormorant text-3xl text-[#1C1714] mb-2">Bot Configuration</p>
            <p className="font-syne text-[12px] text-[#8A7F6A] mb-8 leading-relaxed">
              The widget is currently set up for three flows: quote, work preview, and questions. Leads are saved to <code className="font-mono text-[11px] bg-[#EDE4CC] px-1.5 py-0.5">data/leads.json</code> on the server.
            </p>

            <div className="flex flex-col gap-6">
              {[
                { label: "Greeting", value: "Hey there. What brings you here today?" },
                { label: "Quote flow", value: "Name → Email → Service → Message → Save lead" },
                { label: "Work flow", value: "Shows Dakytech, Kamanda2Nis, Vladie's Beauty with links" },
                { label: "Question flow", value: "Message → Email → Save lead" },
                { label: "Success message", value: "Got it. Curtis will be in touch within 24 hours." },
              ].map(({ label, value }) => (
                <div key={label} className="border-b border-[#D4C9B0] pb-5">
                  <p className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A] mb-2">{label}</p>
                  <p className="font-syne text-[12px] text-[#1C1714] leading-relaxed">{value}</p>
                </div>
              ))}

              <div className="border border-[#D4C9B0] p-5 mt-2">
                <p className="font-syne text-[9px] tracking-[0.25em] uppercase text-[#9A8F7A] mb-3">Storage</p>
                <p className="font-syne text-[12px] text-[#8A7F6A] leading-relaxed">
                  Leads are saved to <code className="font-mono text-[11px] bg-[#EDE4CC] px-1.5 py-0.5">data/leads.json</code>. This works on any persistent Node.js server. For Vercel serverless, connect a database (Supabase, Neon, etc.) and replace the <code className="font-mono text-[11px] bg-[#EDE4CC] px-1.5 py-0.5">lib/leads.ts</code> helpers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
