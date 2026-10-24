import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  ShieldCheck,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';

export const LandingFooterCTA: React.FC = () => {
  return (
    <section
      className="landing-footer-cta-section"
      style={{
        paddingTop: '3rem',
        paddingBottom: '5rem',
        position: 'relative',
      }}
    >
      <div className="layout-container">
        <div
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.98) 0%, rgba(242, 239, 255, 0.9) 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '3.5rem 2.5rem',
            textAlign: 'center',
            boxShadow: 'var(--clay-shadow-lg), inset 2px 2px 6px rgba(255, 255, 255, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(155, 109, 255, 0.18) 0%, transparent 70%)',
              top: '-15%',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '0.45rem 1.1rem',
              borderRadius: '999px',
              boxShadow: 'var(--clay-shadow-sm)',
              marginBottom: '1.25rem',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
            }}
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-white)' }}>
              Deterministic IPAM & Topology Engineering
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--text-white)',
              lineHeight: 1.12,
              maxWidth: '720px',
              margin: '0 auto 1.25rem',
            }}
          >
            Ready to Build Your Enterprise Network Blueprint?
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              maxWidth: '580px',
              margin: '0 auto 2.25rem',
              lineHeight: 1.6,
            }}
          >
            Create blank or pre-configured network topologies, assign collision-free subnets, 
            run automated pre-flight checks, and export audit briefs in seconds.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '2.5rem',
            }}
          >
            <Link
              to="/projects"
              className="btn-clay-primary magnetic-btn"
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
              <span>Quick Subnet Calculator</span>
            </Link>
          </div>

          {/* Bottom Security / Architecture Indicators */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>RFC 1918 / 4632 Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Hardware Rack Visualizer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Terminal className="w-4 h-4 text-cyan-600" />
              <span>Full CSV & PDF Exporters</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
