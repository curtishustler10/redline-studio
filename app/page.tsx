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

export default function Home() {
  return (
    <div className="min-h-screen">
      <FunnelNav />
      <main>
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
    </div>
  );
}
