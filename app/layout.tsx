import type { Metadata } from 'next'
import { DM_Serif_Display, Space_Grotesk, Caveat } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { LangProvider } from '@/components/lang-provider'

// Brand v2 "Fil rouge": DM Serif Display for titles, Space Grotesk for text,
// Caveat for the short handwritten red notes.
const display = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400'],
  style: ['normal', 'italic'],
})

const body = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const hand = Caveat({
  subsets: ['latin'],
  variable: '--font-hand',
  weight: ['500', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://redlinestudio.agency'),
  title: "Redline Studio · Agence digitale : sites, emails & pages produit qui vendent",
  description: "Agence digitale : sites, emails automatiques, pages produit, pubs et visibilité Google. Nous relions tout ce qui transforme vos visiteurs en clients.",
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    title: "Redline Studio · Agence digitale : sites, emails & pages produit qui vendent",
    description: "Agence digitale : sites, emails automatiques, pages produit, pubs et visibilité Google. Nous relions tout ce qui transforme vos visiteurs en clients.",
    siteName: 'Redline Studio',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Redline Studio · Agence digitale : sites, emails & pages produit qui vendent",
    description: "Agence digitale : sites, emails automatiques, pages produit, pubs et visibilité Google. Nous relions tout ce qui transforme vos visiteurs en clients.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${hand.variable}`}>
      <body className="font-sans"><LangProvider>{children}</LangProvider><Analytics /></body>
    </html>
  )
}
