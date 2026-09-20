import HeroSection from "@/components/marketing/hero-section";
import ContainerSpecsCalculator from "@/components/marketing/container-specs-calculator";
import TwoClockPreview from "@/components/marketing/two-clock-preview";
import BentoGrid from "@/components/marketing/bento-grid";
import JourneyTimeline from "@/components/marketing/journey-timeline";
import PortsSection, { CtaBanner } from "@/components/marketing/ports-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ContainerSpecsCalculator />
      <TwoClockPreview />
      <BentoGrid />
      <JourneyTimeline />
      <PortsSection />
      <CtaBanner />
    </>
  );
}
