"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MessageSquare, ArrowRight, Send } from "lucide-react"

type Step = "select" | "form" | "work" | "question" | "success"

type FormData = {
  name: string
  email: string
  service: string
  message: string
}

const SERVICES = ["Website", "Automation", "Growth / SEO", "Other"]

const PROJECTS = [
  { name: "Dakytech", url: "https://www.dakytech.com/", desc: "Tech company website" },
  { name: "Kamanda2Nis", url: "https://kamanda2nis.com/", desc: "E-commerce platform" },
  { name: "Vladie's Beauty", url: "https://vladie.com/", desc: "Brand + booking system" },
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("select")
  const [form, setForm] = useState<FormData>({ name: "", email: "", service: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open, step])

  function reset() {
    setStep("select")
    setForm({ name: "", email: "", service: "", message: "" })
    setError("")
  }

  function handleClose() {
    setOpen(false)
    setTimeout(reset, 400)
  }

  async function submitLead(data: FormData) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed")
      setStep("success")
    } catch {
      setError("Something went wrong. Try emailing us directly.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[340px] bg-[#F2EAD3] border border-[#D4C9B0] shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4C9B0]">
              <div className="flex items-baseline gap-1.5">
                <span className="font-cormorant italic font-light text-lg text-[#9A8F7A]">Red</span>
                <span className="font-syne text-xs font-bold text-[#1C1714] tracking-[0.15em] uppercase">LINE</span>
                <span className="font-cormorant text-lg text-[#C41F1F]">.</span>
              </div>
              <button onClick={handleClose} className="text-[#9A8F7A] hover:text-[#1C1714] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 min-h-[180px]">
              {step === "select" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-syne font-semibold text-[15px] text-[#1C1714] leading-snug mb-1">
                    Hey there.
                  </p>
                  <p className="font-syne text-[12px] text-[#8A7F6A] leading-relaxed mb-6">
                    What brings you here today?
                  </p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: "Get a quote", action: () => setStep("form") },
                      { label: "See our work", action: () => setStep("work") },
                      { label: "Ask a question", action: () => setStep("question") },
                    ].map(({ label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="group flex items-center justify-between px-4 py-3 border border-[#D4C9B0] hover:border-[#C41F1F] text-[#1C1714] hover:text-[#C41F1F] transition-all duration-200 text-left"
                      >
                        <span className="font-syne text-[11px] tracking-[0.15em] uppercase">{label}</span>
                        <ArrowRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "form" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-syne font-semibold text-[15px] text-[#1C1714] mb-1">Get a quote</p>
                  <p className="font-syne text-[12px] text-[#8A7F6A] mb-5">A few quick details:</p>
                  <div className="flex flex-col gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-transparent border-b border-[#D4C9B0] focus:border-[#C41F1F] outline-none font-syne text-[12px] text-[#1C1714] placeholder-[#C0B8A8] py-2 transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="Your email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-transparent border-b border-[#D4C9B0] focus:border-[#C41F1F] outline-none font-syne text-[12px] text-[#1C1714] placeholder-[#C0B8A8] py-2 transition-colors"
                    />
                    <select
                      value={form.service}
                      onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                      className="w-full bg-[#F2EAD3] border-b border-[#D4C9B0] focus:border-[#C41F1F] outline-none font-syne text-[12px] text-[#1C1714] py-2 transition-colors cursor-pointer"
                    >
                      <option value="">What do you need?</option>
                      {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea
                      placeholder="Tell us more (optional)"
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      rows={2}
                      className="w-full bg-transparent border-b border-[#D4C9B0] focus:border-[#C41F1F] outline-none font-syne text-[12px] text-[#1C1714] placeholder-[#C0B8A8] py-2 resize-none transition-colors"
                    />
                    {error && <p className="font-syne text-[11px] text-[#C41F1F]">{error}</p>}
                    <button
                      onClick={() => submitLead(form)}
                      disabled={!form.name || !form.email || loading}
                      className="flex items-center justify-center gap-2 bg-[#C41F1F] text-[#F2EAD3] font-syne text-[11px] tracking-[0.2em] uppercase py-3 px-4 hover:bg-[#A01818] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                    >
                      {loading ? "Sending…" : <>Send <Send className="w-3 h-3" /></>}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "work" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-syne font-semibold text-[15px] text-[#1C1714] mb-1">Our work</p>
                  <p className="font-syne text-[12px] text-[#8A7F6A] mb-5">Recent projects:</p>
                  <div className="flex flex-col gap-2 mb-5">
                    {PROJECTS.map(({ name, url, desc }) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between px-4 py-3 border border-[#D4C9B0] hover:border-[#C41F1F] transition-colors"
                      >
                        <div>
                          <div className="font-syne text-[11px] tracking-[0.1em] uppercase text-[#1C1714] group-hover:text-[#C41F1F] transition-colors">{name}</div>
                          <div className="font-syne text-[10px] text-[#9A8F7A] mt-0.5">{desc}</div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-[#C0B8A8] group-hover:text-[#C41F1F] transition-colors" />
                      </a>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep("form")}
                    className="font-syne text-[11px] tracking-[0.2em] uppercase text-[#C41F1F] border-b border-[#C41F1F] pb-0.5 hover:opacity-70 transition-opacity"
                  >
                    Discuss a project →
                  </button>
                </motion.div>
              )}

              {step === "question" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-syne font-semibold text-[15px] text-[#1C1714] mb-1">Ask a question</p>
                  <p className="font-syne text-[12px] text-[#8A7F6A] mb-5">We'll reply by email:</p>
                  <div className="flex flex-col gap-3">
                    <textarea
                      ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
                      placeholder="Your question"
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      rows={3}
                      className="w-full bg-transparent border-b border-[#D4C9B0] focus:border-[#C41F1F] outline-none font-syne text-[12px] text-[#1C1714] placeholder-[#C0B8A8] py-2 resize-none transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="Your email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-transparent border-b border-[#D4C9B0] focus:border-[#C41F1F] outline-none font-syne text-[12px] text-[#1C1714] placeholder-[#C0B8A8] py-2 transition-colors"
                    />
                    {error && <p className="font-syne text-[11px] text-[#C41F1F]">{error}</p>}
                    <button
                      onClick={() => submitLead({ ...form, name: form.email.split("@")[0], service: "Question" })}
                      disabled={!form.email || !form.message || loading}
                      className="flex items-center justify-center gap-2 bg-[#C41F1F] text-[#F2EAD3] font-syne text-[11px] tracking-[0.2em] uppercase py-3 px-4 hover:bg-[#A01818] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                    >
                      {loading ? "Sending…" : <>Send <Send className="w-3 h-3" /></>}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-6"
                >
                  <div className="w-10 h-10 bg-[#C41F1F] flex items-center justify-center mb-4">
                    <span className="text-[#F2EAD3] text-lg">✦</span>
                  </div>
                  <p className="font-cormorant font-light italic text-2xl text-[#1C1714] mb-2">Got it.</p>
                  <p className="font-syne text-[12px] text-[#8A7F6A] leading-relaxed max-w-[220px]">
                    Curtis will be in touch within 24 hours.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 font-syne text-[10px] tracking-[0.25em] uppercase text-[#9A8F7A] hover:text-[#1C1714] transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 bg-[#C41F1F] hover:bg-[#A01818] flex items-center justify-center transition-colors shadow-lg"
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5 text-[#F2EAD3]" /></motion.span>
            : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageSquare className="w-5 h-5 text-[#F2EAD3]" /></motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
