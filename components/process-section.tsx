"use client"

import { motion } from "framer-motion"
import { MessageCircle, Palette, Rocket, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  {
    icon: MessageCircle,
    title: "Discovery",
    description: "We listen. You tell us where you are and where you want to be. We figure out the best path forward.",
    number: "01",
  },
  {
    icon: Palette,
    title: "Design",
    description: "Wireframes, layouts, revisions. We keep going until it feels right.",
    number: "02",
  },
  {
    icon: Rocket,
    title: "Build & Launch",
    description: "Built clean, tested thoroughly, launched when it's ready.",
    number: "03",
  },
]

export function ProcessSection() {
  return (
    <section id="process" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How we{" "}
            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              work
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            A clear approach. No surprises.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className={`flex items-center gap-8 mb-16 ${index % 2 === 1 ? "flex-row-reverse" : ""}`}>
                {/* Step Content */}
                <div className="flex-1">
                  <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                        <span className="text-red-500 font-mono text-sm">Step {step.number}</span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-lg">{step.description}</p>
                  </div>
                </div>

                {/* Step Number */}
                <div className="hidden lg:block">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-red-500">{step.number}</span>
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-16 bg-gradient-to-b from-red-500/50 to-transparent -mt-8 hidden lg:block" />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 px-8 py-4 text-lg group"
          >
            Start your project
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
