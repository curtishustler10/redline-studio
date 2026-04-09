import { HeroSection } from "@/components/hero-section"
import { ProjectsSection } from "@/components/projects-section"
import { ProcessSection } from "@/components/process-section"
import { ServicesSection } from "@/components/services-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SideNav } from "@/components/side-nav"
import { ChatWidget } from "@/components/chat-widget"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <SideNav />
      <main>
        <HeroSection />
        <ServicesSection />
        <ProjectsSection />
        <ProcessSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}
