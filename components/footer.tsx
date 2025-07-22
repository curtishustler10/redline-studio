"use client"

import { motion } from "framer-motion"
import { Linkedin, Instagram, Facebook, MessageCircle } from "lucide-react"

export function Footer() {
  const socialLinks = [
    { icon: Linkedin, href: "https://www.linkedin.com/in/kornel-gromadka/", label: "LinkedIn" },
    { icon: Instagram, href: "https://www.instagram.com/fidelis_agency/", label: "Instagram" },
    { icon: Facebook, href: "https://www.facebook.com/profile.php?id=100088596349361", label: "Facebook" },
    { icon: MessageCircle, href: "https://wa.me/32495771767", label: "WhatsApp" },
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
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-slate-900 font-bold text-xl">F</span>
              </div>
              <span className="text-white font-bold text-2xl">Fidelis Agency</span>
            </div>
            <p className="text-slate-400 max-w-md mx-auto">
              Transforming businesses through premium web design and growth-driven marketing strategies.
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
                className="w-12 h-12 bg-slate-800/50 hover:bg-emerald-500/20 border border-slate-700/50 hover:border-emerald-500/50 rounded-xl flex items-center justify-center transition-all duration-300 group"
              >
                <social.icon className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
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
            <p className="text-slate-400">© 2025 Fidelis Agency. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
