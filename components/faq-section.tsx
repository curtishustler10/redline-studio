"use client"

import { motion } from "framer-motion"
import { Plus, Minus } from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    question: "How much does a website cost?",
    answer:
      "Prices range from €1,000 for a single-page showcase site to €10,000 for a multi-language site with dynamic features and custom integrations. We provide a detailed quote tailored to your exact needs.",
  },
  {
    question: "What is the typical turnaround time?",
    answer: "Our custom websites launch in 4–6 weeks, depending on complexity and your feedback cycle.",
  },
  {
    question: "Do I really need a website?",
    answer:
      "Absolutely. Over 50% of customers won't trust a business without a modern, mobile-friendly website. It's your 24/7 storefront.",
  },
  {
    question: "When should I redesign my site?",
    answer:
      "If it's not responsive, outdated (5+ years old), or failing to attract customers, it's time for a fresh look.",
  },
  {
    question: "Why choose Fidelis Agency?",
    answer:
      "We focus on results, combining powerful marketing strategies with stunning design to turn visitors into customers. We're committed until you're 100% satisfied.",
  },
  {
    question: "What happens during the discovery call?",
    answer: "We identify your pain points, goals, and determine the best solutions to help you grow.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get answers to the most common questions about our services and process
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="mb-4"
            >
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-slate-700/20 transition-colors duration-200"
                >
                  <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    {openIndex === index ? (
                      <Minus className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Plus className="w-6 h-6 text-emerald-400" />
                    )}
                  </motion.div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? "auto" : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6">
                    <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
