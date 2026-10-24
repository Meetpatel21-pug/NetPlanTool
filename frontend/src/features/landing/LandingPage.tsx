import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LandingHero } from './components/LandingHero';
import { LandingScrollytelling } from './components/LandingScrollytelling';
import { LandingCidrBreakdown } from './components/LandingCidrBreakdown';
import { LandingValidationRules } from './components/LandingValidationRules';
import { LandingToolkitDirectory } from './components/LandingToolkitDirectory';
import { LandingFooterCTA } from './components/LandingFooterCTA';
import { IngrassiaParticleAtmosphere } from './components/IngrassiaParticleAtmosphere';
import { LandingSubnetMatrix } from './components/LandingSubnetMatrix';
import { LandingArchitectureComparison } from './components/LandingArchitectureComparison';
import { LandingProtocolStandards } from './components/LandingProtocolStandards';
import { LandingTelemetryStrip } from './components/LandingTelemetryStrip';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

export const LandingPage: React.FC = () => {
  const landingWrapperRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // CINEMATIC GSAP + LENIS MOTION SYSTEM ORCHESTRATION
  // =========================================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lenis: Lenis | null = null;
    let tickerHandler: ((time: number) => void) | null = null;
    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Initialize Lenis Smooth Scroll
    if (!reduceMotion && typeof window.matchMedia === 'function') {
      try {
        lenis = new Lenis({
          lerp: 0.08,
          smoothWheel: true,
          wheelMultiplier: 0.9,
        });

        lenis.on('scroll', ScrollTrigger.update);

        tickerHandler = (time: number) => {
          lenis?.raf(time * 1000);
        };
        gsap.ticker.add(tickerHandler);
        gsap.ticker.lagSmoothing(0);
      } catch {
        // Fallback gracefully to native scroll
      }
    }

    // 2. GSAP Context for Scoped Animations
    const ctx = gsap.context(() => {
      // Hero Kinetic Masked Typography Reveal
      if (document.querySelector('.kinetic-line')) {
        gsap.fromTo(
          '.kinetic-line',
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.95,
            ease: 'power4.out',
            stagger: 0.12,
          }
        );
      }

      if (document.querySelector('.hero-anim-item')) {
        gsap.fromTo(
          '.hero-anim-item',
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.08,
            delay: 0.2,
          }
        );
      }

      // Sticky Architecture Card Stack Progression
      const stackCards = gsap.utils.toArray<HTMLElement>('.cinematic-stack-card');
      stackCards.forEach((card, index) => {
        const nextCard = stackCards[index + 1];
        if (!nextCard) return;

        gsap.to(card, {
          scale: 0.94 + index * 0.015,
          autoAlpha: 0.8,
          y: -22,
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 82%',
            end: 'top 28%',
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });

      // Magnetic hover physics for buttons
      const magneticBtns = gsap.utils.toArray<HTMLElement>('.magnetic-btn');
      magneticBtns.forEach((btn) => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(btn, {
            x: x * 0.18,
            y: y * 0.18,
            duration: 0.3,
            ease: 'power2.out',
          });
        };

        const handleMouseLeave = () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.45,
            ease: 'elastic.out(1, 0.4)',
          });
        };

        btn.addEventListener('mousemove', handleMouseMove);
        btn.addEventListener('mouseleave', handleMouseLeave);
      });
    }, landingWrapperRef);

    return () => {
      ctx.revert();
      if (tickerHandler) {
        gsap.ticker.remove(tickerHandler);
      }
      if (lenis) {
        lenis.destroy();
      }
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={landingWrapperRef}
      className="clay-landing-page"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        color: 'var(--text-white)',
        overflowX: 'clip',
      }}
    >
      {/* 0. INGRASSIA-STYLE AMBIENT WEBGL POINT CLOUD CONSTELLATION */}
      <IngrassiaParticleAtmosphere />

      {/* 1. HERO SECTION WITH 3D ANIMATED MODEL IN HEADER */}
      <LandingHero />

      {/* 2. CINEMATIC STICKY SCROLLYTELLING PRODUCT SHOWCASE */}
      <section
        className="cinematic-sticky-stack"
        style={{
          position: 'relative',
          paddingTop: '3rem',
          paddingBottom: '5rem',
        }}
      >
        <div className="layout-container">
          {/* Section 2: Spatial Datacenter Topology Architecture Walkthrough */}
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                padding: '0.45rem 1.25rem',
                borderRadius: '999px',
                boxShadow:
                  '0 4px 14px rgba(124, 92, 191, 0.1), inset 1.5px 1.5px 2px #ffffff, inset -1px -1px 2px rgba(180, 165, 220, 0.25)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                marginBottom: '1rem',
              }}
            >
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2d1f4e' }}>
                Spatial Datacenter Topology Architecture
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2rem, 3.8vw, 3rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#2d1f4e',
                marginBottom: '0.75rem',
              }}
            >
              Interactive 3D Infrastructure Walkthrough
            </h2>

            <p
              style={{
                fontSize: '1.05rem',
                color: '#5e4e7e',
                lineHeight: 1.6,
                maxWidth: '680px',
                margin: '0 auto',
              }}
            >
              Scroll down to inspect gateway routing, VLAN micro-segmentation, server racks, and automated conflict detection in real time.
            </p>
          </div>

          {/* Sticky Stacked Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* STACK CARD 1: 3D Holographic Network Topology Stage & Fullscreen Portal */}
            <LandingScrollytelling />

            {/* STACK CARD 2: Deterministic Multi-Tier CIDR Allocation Engine */}
            <LandingCidrBreakdown />
          </div>
        </div>
      </section>

      {/* 2B. ENTERPRISE LIVE TELEMETRY STRIP */}
      <LandingTelemetryStrip />

      {/* 2C. INTERACTIVE IPV4 CIDR MATRIX & HOST CAPACITY MATRIX */}
      <LandingSubnetMatrix />

      {/* 2D. TRADITIONAL SPREADSHEETS VS NETPLAN BENCHMARK COMPARISON */}
      <LandingArchitectureComparison />

      {/* 3. AUTOMATED CONFLICT VALIDATION ENGINE */}
      <LandingValidationRules />

      {/* 3B. INDUSTRY RFC PROTOCOL SPECIFICATIONS & IEEE STANDARDS */}
      <LandingProtocolStandards />

      {/* 4. COMPLETE TOOLKIT DIRECTORY */}
      <LandingToolkitDirectory />

      {/* 5. FOOTER CALL-TO-ACTION */}
      <LandingFooterCTA />
    </div>
  );
};
