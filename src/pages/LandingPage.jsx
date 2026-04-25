import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import CTASection from "../components/landing/CTASection";
import LandingFooter from "../components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Navbar */}
      <LandingNavbar />

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}