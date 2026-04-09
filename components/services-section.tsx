"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

const services = [
  {
    number: "01",
    title: "Websites &\nDigital Presence",
    description:
      "Built from scratch to represent your business properly — not a theme, not a drag-and-drop. Fast, clean, and designed to convert.",
    features: ["Custom Design", "Mobile First", "SEO Ready", "Built to Last"],
  },
  {
    number: "02",
    title: "Automation &\nSystems",
    description:
      "The back-end tools that save you hours every week — booking flows, CRM integrations, automated follow-ups, and custom business logic.",
    features: ["Workflow Automation", "Custom Integrations", "Booking & CRM", "Ongoing Support"],
  },
  {
    number: "03",
    title: "Online\nGrowth",
    description:
      "We help you show up where your customers are looking — local SEO, Google Business, and targeted strategy built around your actual goals.",
    features: ["Local SEO", "Google Business", "Content Strategy", "Monthly Reporting"],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-24 md:py-32 border-t border-[#D4C9B0]">
      <div className="container mx-auto px-6 md:px-12">

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex items-center gap-6 mb-16 md:mb-20"
        >
          <span className="font-syne text-[15px] tracking-[0.2em] uppercase text-[#9A8F7A]">
            What we build
          </span>
          <div className="flex-1 h-px bg-[#D4C9B0]" />
        </motion.div>

        {/* Service rows */}
        <div>
          {services.map((service, index) => (
            <motion.div
              key={service.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group border-t border-[#D4C9B0] py-10 md:py-12 last:border-b grid grid-cols-12 gap-4 md:gap-8 items-start hover:border-[#C41F1F]/30 transition-colors duration-500 cursor-default"
            >
              {/* Number */}
              <div className="col-span-1">
                <span className="font-syne text-[10px] tracking-widest text-[#C0B8A8] mt-2 block">
                  {service.number}
                </span>
              </div>

              {/* Title */}
              <div className="col-span-11 md:col-span-3">
                <h3 className="font-cormorant font-light text-3xl md:text-4xl text-[#1C1714] leading-tight whitespace-pre-line">
                  {service.title}
                </h3>
              </div>

              {/* Description */}
              <div className="col-span-11 md:col-span-6 md:col-start-5">
                <p className="font-syne text-[#8A7F6A] text-sm leading-relaxed mb-6">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((f) => (
                    <span
                      key={f}
                      className="font-syne text-[9px] tracking-[0.2em] uppercase text-[#9A8F7A] border border-[#D4C9B0] px-3 py-1.5"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex col-span-2 justify-end pt-1">
                <ArrowUpRight className="w-4 h-4 text-[#D4C9B0] group-hover:text-[#C41F1F] transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
