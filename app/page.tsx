import { FunnelNav } from "@/components/funnel/nav";
import { FunnelHero } from "@/components/funnel/hero";
import { FunnelDiagnostic } from "@/components/funnel/diagnostic";
import { FunnelBriques } from "@/components/funnel/briques";
import { FunnelSimulator } from "@/components/funnel/simulator";
import { FunnelCases } from "@/components/funnel/cases";
import { FunnelDeliverables } from "@/components/funnel/deliverables";
import { FunnelMethod } from "@/components/funnel/method";
import { FunnelOffers } from "@/components/funnel/offers";
import { FunnelFooter } from "@/components/funnel/footer";
import { StickyDiagnostic } from "@/components/funnel/sticky-diagnostic";
import { ScrollThread } from "@/components/motion/scroll-thread";

export default function Home() {
  return (
    <div className="min-h-screen">
      <FunnelNav />
      {/* isolate: the scroll thread sits at z -10, above the page background, under the content. */}
      <main className="relative isolate">
        <ScrollThread />
        <FunnelHero />
        <FunnelDiagnostic />
        <FunnelBriques />
        <FunnelSimulator />
        <FunnelCases />
        <FunnelDeliverables />
        <FunnelMethod />
        <FunnelOffers />
      </main>
      <FunnelFooter />
      <StickyDiagnostic />
    </div>
  );
}
