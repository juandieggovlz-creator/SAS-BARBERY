'use client'

import React from 'react'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import TrustedBy from '@/components/landing/TrustedBy'
import ScrollExpandShowcase from '@/components/landing/ScrollExpandShowcase'
import ProblemSolution from '@/components/landing/ProblemSolution'
import FeatureBento from '@/components/landing/FeatureBento'
import WebpageShowcase from '@/components/landing/WebpageShowcase'
import HowItWorks from '@/components/landing/HowItWorks'
import Metrics from '@/components/landing/Metrics'
import Testimonials from '@/components/landing/Testimonials'
import PricingPlans from '@/components/landing/PricingPlans'
import FAQSection from '@/components/landing/FAQSection'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="landing-page-root min-h-screen bg-white dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950 antialiased overflow-x-hidden transition-colors duration-200">
      {/* 1. Floating Glassmorphism Navbar */}
      <Navbar />

      {/* 2. Full-viewport Hero with Multi-layer Mockups */}
      <Hero />

      {/* 2.5 Social Proof: Stats & Integrations Banner */}
      <TrustedBy />

      {/* 3. GSAP ScrollTrigger Showcase: Expansión interactiva en scroll */}
      <ScrollExpandShowcase />

      {/* 4. Problem vs Solution: Traditional chaos vs BarberOS order */}
      <ProblemSolution />

      {/* 5. Comprehensive Feature Bento Grid */}
      <FeatureBento />

      {/* 6. Public Booking Webpage Device Showcase */}
      <WebpageShowcase />

      {/* 7. How It Works (4-Step Onboarding) */}
      <HowItWorks />

      {/* 8. Verified Impact Metrics & Live Counter */}
      <Metrics />

      {/* 9. Credible Testimonials Carousel */}
      <Testimonials />

      {/* 10. Pricing & Plans Structure */}
      <PricingPlans />

      {/* 11. Interactive FAQ Accordion */}
      <FAQSection />

      {/* 12. Final Conversion CTA */}
      <FinalCTA />

      {/* 13. Comprehensive SaaS Footer */}
      <Footer />
    </div>
  )
}
