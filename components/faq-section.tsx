"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    question: "How much does a website cost?",
    answer:
      "Prices range from $2,000 for a single-page site to $15,000 for a multi-language site with dynamic features and custom integrations. We provide a detailed quote tailored to your exact needs.",
  },
  {
    question: "What is the typical turnaround time?",
    answer: "Our custom websites launch in 4–6 weeks, depending on complexity and your feedback cycle.",
  },
  {
    question: "Do I really need a website?",
    answer:
      "Over 50% of customers won't engage with a business that doesn't have a modern, mobile-friendly website. It's your 24/7 storefront.",
  },
  {
    question: "When should I redesign my site?",
    answer:
      "If it's not responsive, outdated (5+ years old), or failing to attract customers, it's time for a fresh look.",
  },
  {
    question: "Why Redline Studio?",
    answer:
      "Because we actually study your business before we build anything. No templates, no recycled designs. You get someone who understands what you do and builds something that fits — not something that just looks like it fits.",
  },
  {
    question: "What happens during the discovery call?",
    answer: "We identify your pain points, goals, and determine the best solutions to help you grow.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 md:py-32 border-t border-[#D4C9B0]">
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
            Common questions
          </span>
          <div className="flex-1 h-px bg-[#D4C9B0]" />
          <span className="font-syne text-[15px] tracking-[0.2em] uppercase text-[#C0B8A8]">
            If something isn&apos;t answered here, just ask
          </span>
        </motion.div>

        <div className="max-w-3xl">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="border-t border-[#D4C9B0] last:border-b"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full py-6 text-left flex items-center justify-between gap-8 group"
              >
                <span className="font-cormorant font-light text-xl md:text-2xl text-[#1C1714] group-hover:text-[#C41F1F] transition-colors duration-300 leading-tight">
                  {faq.question}
                </span>
                <span className="flex-shrink-0 text-[#C0B8A8] group-hover:text-[#C41F1F] transition-colors">
                  {openIndex === index
                    ? <Minus className="w-4 h-4" />
                    : <Plus className="w-4 h-4" />
                  }
                </span>
              </button>

              <motion.div
                initial={false}
                animate={{ height: openIndex === index ? "auto" : 0, opacity: openIndex === index ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="font-syne text-[#8A7F6A] text-sm leading-relaxed pb-6 max-w-xl">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
