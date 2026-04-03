"use client"

import { motion } from "framer-motion"
import { Globe, TrendingUp, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const services = [
  {
    icon: Globe,
    title: "Websites & Digital Platforms",
    description:
      "Conversion-first sites built around your goals. Every detail considered, every page purposeful.",
    features: ["Responsive Design", "SEO Optimized", "Fast Loading", "Conversion Focused"],
  },
  {
    icon: TrendingUp,
    title: "Automation & Systems",
    description:
      "We build the systems that save you time — workflows, integrations, and tools that run while you focus on your business.",
    features: ["Workflow Automation", "Custom Integrations", "Business Tools", "Ongoing Support"],
  },
  {
    icon: Users,
    title: "Growth & Strategy",
    description: "SEO, paid media, and data-driven strategy — structured around what actually moves the needle.",
    features: ["SEO Optimization", "Paid Advertising", "Social Media", "Analytics & Reporting"],
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What we{" "}
            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              build
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Every solution is tailored to where you are and where you need to be.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">{service.description}</p>

                <ul className="space-y-2 mb-6">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-300 hover:bg-red-500/10 p-0 h-auto group/btn"
                  >
                    Learn More
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            size="lg"
            variant="outline"
            className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white px-8 py-4 text-lg bg-transparent"
          >
            Talk to us about your project
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
