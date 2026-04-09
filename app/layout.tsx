import type { Metadata } from 'next'
import { Cormorant_Garamond, Syne } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Redline Studio — Digital Systems for Local Business',
  description: 'We don\'t do templates. We build what your business needs — websites, automation, and digital tools crafted around how you actually operate.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${syne.variable}`}>
      <body className="font-syne">{children}</body>
    </html>
  )
}
