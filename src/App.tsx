import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { VenueSection } from './components/VenueSection';
import { ServicesSection } from './components/ServicesSection';
import { EventsSection } from './components/EventsSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { GallerySection } from './components/GallerySection';
import { BookingSection } from './components/BookingSection';
import { FAQSection } from './components/FAQSection';
import { LocationSection } from './components/LocationSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { MobileCta } from './components/MobileCta';
import { useHashNavigation } from './lib/hooks';

export default function App() {
  useHashNavigation();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:bg-gold focus:px-4 focus:py-3 focus:text-plum">Skip to main content</a>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <HeroSection /><AboutSection /><VenueSection /><ServicesSection /><EventsSection /><WhyChooseUs />
        <GallerySection /><BookingSection /><FAQSection /><LocationSection /><ContactSection />
      </main>
      <Footer />
      <MobileCta />
    </>
  );
}
