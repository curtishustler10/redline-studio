"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

const projects = [
  {
    title: "Omnilux",
    description: "E-commerce experience for a medical-grade LED skincare brand — tiered product ecosystem, conversion-focused layout, and social-proof-led storytelling built to scale.",
    image: "/placeholder.svg?height=400&width=600",
    url: "https://omniluxled.com/",
    tags: ["E-commerce", "DTC Brand"],
  },
  {
    title: "Maya Hair Products",
    description: "Shopify storefront for an organic hair-care brand — handmade product range, salon-style merchandising, and a launch-ready landing page.",
    image: "/placeholder.svg?height=400&width=600",
    url: "https://mayahairproducts.com/",
    tags: ["Shopify", "DTC Brand"],
  },
  {
    title: "Tangéroise",
    description: "Brand site for a Moroccan caftan rental house — minimalist editorial layout, refined French copy, and an appointment-led customer flow.",
    image: "/placeholder.svg?height=400&width=600",
    url: "https://tangeroise-site.vercel.app/",
    tags: ["Brand Site", "Editorial"],
  },
  {
    title: "Baroude et Recettes",
    description: "E-commerce and content hub for an artisanal cold-process soap brand — shop, blog, workshops, and a values-led visual story under one roof.",
    image: "/placeholder.svg?height=400&width=600",
    url: "https://baroudeetrecettes.fr/",
    tags: ["E-commerce", "Content Hub"],
  },
]

export function ProjectsSection() {
  return (
    <section id="projects" className="py-24 md:py-32 border-t border-[#D4C9B0]">
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
            Work we&apos;ve done
          </span>
          <div className="flex-1 h-px bg-[#D4C9B0]" />
          <span className="font-syne text-[15px] tracking-[0.2em] uppercase text-[#C0B8A8]">
            Real businesses, real briefs, built properly
          </span>
        </motion.div>

        {/* Project rows */}
        <div>
          {projects.map((project, index) => (
            <motion.a
              key={project.title}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group border-t border-[#D4C9B0] py-10 md:py-12 last:border-b grid grid-cols-12 gap-4 md:gap-8 items-center hover:border-[#C41F1F]/30 transition-colors duration-500 cursor-pointer"
            >
              {/* Number */}
              <div className="col-span-1">
                <span className="font-syne text-[10px] tracking-widest text-[#C0B8A8]">
                  0{index + 1}
                </span>
              </div>

              {/* Title */}
              <div className="col-span-11 md:col-span-3">
                <h3 className="font-syne font-semibold text-xl md:text-2xl text-[#1C1714] leading-snug group-hover:text-[#C41F1F] transition-colors duration-300 tracking-tight">
                  {project.title}
                </h3>
              </div>

              {/* Description + tags */}
              <div className="col-span-11 md:col-span-6 md:col-start-5">
                <p className="font-syne text-[#8A7F6A] text-sm leading-relaxed mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-syne text-[9px] tracking-[0.2em] uppercase text-[#9A8F7A] border border-[#D4C9B0] px-3 py-1.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex col-span-2 justify-end">
                <ArrowUpRight className="w-4 h-4 text-[#D4C9B0] group-hover:text-[#C41F1F] transition-colors duration-300" />
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  )
}
