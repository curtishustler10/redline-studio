"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "We study your business",
    description:
      "Not a questionnaire. A real conversation. We want to understand how you actually operate before we build anything — what's working, what's not, and what would actually make a difference.",
  },
  {
    number: "02",
    title: "We design with intention",
    description:
      "Every layout choice, every piece of copy, every interaction has a reason. You'll know why before we ship. We don't move forward until it's right.",
  },
  {
    number: "03",
    title: "We build and stay",
    description:
      "We don't disappear after launch. Your business changes — new services, new offers, new goals. We stay on and adjust with you.",
  },
]

export function ProcessSection() {
  return (
    <section id="process" className="py-24 md:py-32 border-t border-[#D4C9B0]">
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
            How we work
          </span>
          <div className="flex-1 h-px bg-[#D4C9B0]" />
          <span className="font-syne text-[15px] tracking-[0.2em] uppercase text-[#C0B8A8]">
            We treat every project like it&apos;s the only one on our desk
          </span>
        </motion.div>

        {/* Steps */}
        <div>
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="border-t border-[#D4C9B0] py-12 md:py-16 last:border-b grid grid-cols-12 gap-4 md:gap-12 items-start"
            >
              {/* Big faded number */}
              <div className="col-span-2 md:col-span-2">
                <span className="font-cormorant font-light text-[60px] md:text-[90px] leading-none text-[#DCCFB8] select-none">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <div className="col-span-10 md:col-span-7 pt-2 md:pt-4">
                <h3 className="font-cormorant font-light text-3xl md:text-4xl text-[#1C1714] mb-4 leading-tight">
                  {step.title}
                </h3>
                <p className="font-syne text-[#8A7F6A] text-sm leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
