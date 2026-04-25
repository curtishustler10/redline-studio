"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

export function CTASection() {
  return (
    <section id="contact" className="py-24 md:py-32 border-t border-[#D4C9B0]">
      <div className="container mx-auto px-6 md:px-12">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="font-syne text-[15px] tracking-[0.2em] uppercase text-[#9A8F7A] block mb-10">
            Start a project
          </span>

          <h2 className="font-cormorant font-light text-[52px] md:text-[72px] lg:text-[88px] text-[#1C1714] leading-[0.95] tracking-tight mb-10">
            Have a project<br />in mind?
          </h2>

          <p className="font-syne text-[#8A7F6A] text-sm leading-relaxed max-w-md mb-12">
            No pitch. No proposal deck. Just a straight conversation about your business and what it needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 sm:items-center items-start">
            <a
              href="mailto:hello@redlinestudio.agency"
              className="group inline-flex items-center gap-2 font-syne text-[12px] md:text-[13px] tracking-[0.2em] uppercase font-medium text-[#F2EAD3] bg-[#C41F1F] hover:bg-[#A01818] px-6 py-3.5 transition-colors duration-300"
            >
              Email us
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <span className="font-syne text-[12px] tracking-[0.2em] uppercase text-[#8A7F6A]">
              hello@redlinestudio.agency
            </span>
          </div>
        </motion.div>

        {/* Bottom detail row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-10 mt-20 pt-10 border-t border-[#D4C9B0]"
        >
          {["50+ local clients", "Every project custom built", "Gold Coast based"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-[#C41F1F]" />
              <span className="font-syne text-[10px] tracking-[0.2em] uppercase text-[#9A8F7A]">{item}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
