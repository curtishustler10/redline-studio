"use client"

import { motion } from "framer-motion"
import { Instagram, MessageCircle } from "lucide-react"
import { Logo } from "./logo"

export function Footer() {
  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/redlinestudio.agency", label: "Instagram" },
    { icon: MessageCircle, href: "https://wa.me/61421915283", label: "WhatsApp" },
  ]

  return (
    <footer className="border-t border-[#D4C9B0] py-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

          {/* Logo */}
          <a href="/">
            <Logo className="text-[14px] text-[#1C1714] hover:opacity-80 transition-opacity" />
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
