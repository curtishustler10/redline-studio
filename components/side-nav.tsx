"use client"

import { useState, useEffect, useCallback } from "react"

const navItems = [
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
]

export function SideNav() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState("")

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) setScrollProgress((scrollTop / docHeight) * 100)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Active section detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`)
          }
        })
      },
      { threshold: 0.25, rootMargin: "0px 0px -50% 0px" }
    )

    navItems.forEach(({ href }) => {
      const el = document.querySelector(href)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="fixed left-0 top-0 h-screen z-40 hidden md:flex items-center">
      {/* Track + progress line */}
      <div className="relative h-full w-px ml-7">
        {/* Full track */}
        <div className="absolute inset-0 bg-[#D4C9B0]" />
        {/* Red growing fill */}
        <div
          className="absolute top-0 left-0 w-full bg-[#C41F1F]"
          style={{ height: `${scrollProgress}%`, transition: "height 0.05s linear" }}
        />
      </div>

      {/* Nav items */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-6">
        {navItems.map(({ label, href }) => {
          const isActive = activeSection === href
          return (
            <button
              key={href}
              onClick={() => scrollTo(href)}
              className="flex items-center gap-3 group cursor-pointer"
              aria-label={`Navigate to ${label}`}
            >
              {/* Dot — centered on the line (line at ml-7 = 28px, dot 8px → ml-6 = 24px) */}
              <div
                className={`ml-6 w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${
                  isActive
                    ? "bg-[#C41F1F] scale-110"
                    : "bg-[#D4C9B0] group-hover:bg-[#9A8F7A]"
                }`}
              />
              {/* Label */}
              <span
                className={`font-syne text-[9px] tracking-[0.3em] uppercase whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "text-[#C41F1F] opacity-100"
                    : "text-[#C0B8A8] opacity-0 group-hover:opacity-100 group-hover:text-[#1C1714]"
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
