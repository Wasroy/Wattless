import TopBanner from "@/components/TopBanner";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TerminalDemo from "@/components/TerminalDemo";
import ComparisonSection from "@/components/ComparisonSection";
import FeaturesSection from "@/components/FeaturesSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import DashboardSection from "@/components/DashboardSection";
import TeamSection from "@/components/TeamSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <TopBanner />
    <Navbar />
    <HeroSection />
    <HowItWorksSection />
    <TerminalDemo />
    <ComparisonSection />
    <FeaturesSection />
    <ArchitectureSection />
    <DashboardSection />
    <TeamSection />
    <CTASection />
    <Footer />
  </div>
);

export default Index;
