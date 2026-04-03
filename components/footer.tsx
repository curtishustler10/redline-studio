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
    <footer className="py-16 border-t border-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <span className="font-mono font-light text-2xl text-neutral-400 lowercase tracking-tight">red</span>
              <span className="font-sans font-semibold text-2xl text-white uppercase tracking-tight">LINE</span>
              <span className="text-red-500 font-semibold text-2xl">.</span>
            </div>
            <p className="text-slate-400 max-w-md mx-auto">
              Custom digital solutions. Real results, measured and delivered.
            </p>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center space-x-6 mb-8"
          >
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-slate-800/50 hover:bg-red-500/20 border border-slate-700/50 hover:border-red-500/50 rounded-xl flex items-center justify-center transition-all duration-300 group"
              >
                <social.icon className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
              </motion.a>
            ))}
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="pt-8 border-t border-slate-800/50"
          >
            <p className="text-slate-400">© 2025 Redline Studio. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
