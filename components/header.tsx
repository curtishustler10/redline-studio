"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "./logo"

const navItems = ["Services", "Projects", "Process", "FAQ", "Contact"]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.querySelector(`#${id.toLowerCase()}`)
    el?.scrollIntoView({ behavior: "smooth" })
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#F2EAD3]/95 border-b border-[#D4C9B0] backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 py-5">
        <div className="flex items-center justify-between">

          {/* Logo + location */}
          <div className="flex items-center gap-6 md:gap-10">
            <a href="/" className="group">
              <Logo className="text-[15px] md:text-[16px] text-[#1C1714] group-hover:opacity-80 transition-opacity" />
            </a>
            <span className="hidden md:block font-syne text-[9px] tracking-[0.3em] uppercase text-[#9A8F7A]">
              Paris · Gold Coast Digital Studio
            </span>
          </div>

          {/* Est + CTA */}
          <div className="hidden md:flex items-center gap-8">
            <span className="font-syne text-[9px] tracking-[0.3em] uppercase text-[#9A8F7A]">
              Est 2022
            </span>
            <a
              href="#contact"
              className="font-syne text-[11px] tracking-[0.2em] uppercase font-medium text-[#F2EAD3] bg-[#C41F1F] hover:bg-[#A01818] px-4 py-2 transition-colors duration-300"
            >
              Get in touch
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#9A8F7A] hover:text-[#1C1714] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <nav className="flex flex-col gap-5 py-8 border-t border-[#D4C9B0] mt-4">
                {navItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollTo(item)}
                    className="font-syne text-[11px] tracking-[0.25em] uppercase text-[#8A7F6A] hover:text-[#1C1714] transition-colors text-left"
                  >
                    {item}
                  </button>
                ))}
                <a
                  href="mailto:hello@redlinestudio.agency"
                  className="font-syne text-[11px] tracking-[0.25em] uppercase text-[#1C1714] border-b border-[#C41F1F] pb-1 w-fit mt-2"
                >
                  Get in touch
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
