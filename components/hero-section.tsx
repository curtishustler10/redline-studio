"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

const stats = [
  { value: "50+", label: "Local Clients" },
  { value: "Zero", label: "Templates Used" },
  { value: "100%", label: "Custom Builds" },
]

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col">
      {/* Main headline block */}
      <div className="flex-1 flex flex-col justify-center container mx-auto px-6 md:px-12 py-16 md:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-cormorant font-light text-[64px] md:text-[100px] lg:text-[130px] leading-[0.92] tracking-tight text-[#1C1714] mb-12 md:mb-16"
        >
          We build<br />
          what your<br />
          business actually<br />
          <em className="text-[#C41F1F] not-italic font-light">needs.</em>
        </motion.h1>

        {/* Subtitle + CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-16"
        >
          <p className="font-syne text-[#8A7F6A] text-sm md:text-base leading-relaxed max-w-sm">
            Websites, automation, and digital tools —<br />
            crafted around how your business actually operates.
          </p>
          <div className="flex items-center gap-6 md:gap-8">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 font-syne text-[12px] md:text-[13px] tracking-[0.2em] uppercase font-medium text-[#F2EAD3] bg-[#C41F1F] hover:bg-[#A01818] px-6 py-3.5 transition-colors duration-300"
            >
              Start a project
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a
              href="#projects"
              className="font-syne text-[12px] tracking-[0.25em] uppercase text-[#8A7F6A] hover:text-[#1C1714] transition-colors duration-300"
            >
              View our work
            </a>
          </div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="border-t border-[#D4C9B0]"
      >
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-3 divide-x divide-[#D4C9B0]">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 md:py-10 px-6 md:px-10 first:pl-0 last:pr-0">
                <div className="font-syne font-medium text-3xl md:text-4xl text-[#1C1714] mb-1 leading-none tracking-tight">
                  {stat.value}
                </div>
                <div className="font-syne text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#9A8F7A] mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
