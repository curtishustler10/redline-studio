"use client"

import { motion } from "framer-motion"
import { Linkedin, Instagram, MessageCircle } from "lucide-react"

export function Footer() {
  const socialLinks = [
    { icon: Linkedin, href: "https://linkedin.com/company/redlinestudio", label: "LinkedIn" },
    { icon: Instagram, href: "https://instagram.com/redlinestudio", label: "Instagram" },
    { icon: MessageCircle, href: "#", label: "WhatsApp" },
  ]

  return (
    <footer className="border-t border-[#D4C9B0] py-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

          {/* Logo */}
          <a href="/" className="flex items-baseline gap-0.5">
            <span className="font-cormorant text-xl italic font-light text-[#9A8F7A]">Red</span>
            <span className="font-syne text-sm font-bold text-[#1C1714] tracking-[0.15em] uppercase">LINE</span>
            <span className="font-cormorant text-xl text-[#C41F1F]">.</span>
          </a>

          {/* Social links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center gap-6"
          >
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-[#C0B8A8] hover:text-[#C41F1F] transition-colors duration-300"
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </motion.div>

          {/* Copyright */}
          <p className="font-syne text-[10px] tracking-[0.2em] uppercase text-[#C0B8A8]">
            © 2025 Redline Studio
          </p>

        </div>
      </div>
    </footer>
  )
}
