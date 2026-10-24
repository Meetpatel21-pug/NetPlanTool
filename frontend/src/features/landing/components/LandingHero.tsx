import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Calculator,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { Hero3DNetworkCore } from './Hero3DNetworkCore';

export const LandingHero: React.FC = () => {
  return (
    <section
      className="landing-hero-section"
      style={{
        position: 'relative',
        paddingTop: '2.5rem',
        paddingBottom: '2rem',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div className="layout-container" style={{ textAlign: 'center' }}>
        {/* Luminous Architectural Badge */}
        <div
          className="hero-anim-item"
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
            marginBottom: '1.25rem',
          }}
        >
          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2d1f4e' }}>
            Next-Gen Network Planning & Subnet Architecture Suite
          </span>
        </div>

        {/* Master Kinetic Headline */}
        <div style={{ overflow: 'hidden', marginBottom: '0.2rem' }}>
          <h1
            className="kinetic-line"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4.4rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              color: '#2d1f4e',
            }}
          >
            Design Networks.
          </h1>
        </div>
        <div style={{ overflow: 'hidden', marginBottom: '1.25rem' }}>
          <h1
            className="kinetic-line"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4.4rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
              background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Master Every Subnet.
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="hero-anim-item"
          style={{
            fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
            color: '#5e4e7e',
            lineHeight: 1.65,
            maxWidth: '740px',
            margin: '0 auto 2rem',
            padding: '0 1rem',
          }}
        >
          The premier full-stack network planning suite with deterministic CIDR decomposition, 
          3D WebGL spatial topology visualization, automated RFC conflict validation, and enterprise audit exports.
        </p>

        {/* Redesigned Clay CTA Buttons */}
        <div
          className="hero-anim-item"
          style={{
            display: 'flex',
            gap: '1.25rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem',
          }}
        >
          <Link
            to="/projects"
            className="btn-clay-primary magnetic-btn"
            style={{ textDecoration: 'none' }}
          >
            <span>Launch Project Workspace</span>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/calculator"
            className="btn-clay-secondary magnetic-btn"
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.12)',
                borderRadius: '50%',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calculator className="w-4 h-4 text-purple-600" />
            </div>
            <span>Open Subnet Calculator</span>
          </Link>
        </div>

        {/* Value Guarantees Strip */}
        <div
          className="hero-anim-item"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.75rem',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
            padding: '0 1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d1f4e' }}>
              RFC 1918 Pre-Flight Engine
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu className="w-4 h-4 text-purple-600" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d1f4e' }}>
              3D Spatial Topology Visualizer
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d1f4e' }}>
              Zero-Overlap Guarantee
            </span>
          </div>
        </div>

        {/* 3D ENTERPRISE CORE DIGITAL TWIN INTEGRATED DIRECTLY BENEATH */}
        <div style={{ width: '100%', position: 'relative', marginTop: '0.5rem' }}>
          <Hero3DNetworkCore />
        </div>

        {/* Subtle Scrollytelling Scroll Cue */}
        <div
          className="hero-scroll-cue-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginTop: '1.25rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            boxShadow:
              '0 4px 16px rgba(124, 92, 191, 0.1), inset 1.5px 1.5px 2px #ffffff, inset -1px -1px 2px rgba(180, 165, 220, 0.25)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            fontSize: '0.825rem',
            fontWeight: 800,
            color: '#7c3aed',
          }}
        >
          <span>Scroll down to explore interactive datacenter scrollytelling</span>
          <ChevronDown className="w-4 h-4 text-purple-600 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
