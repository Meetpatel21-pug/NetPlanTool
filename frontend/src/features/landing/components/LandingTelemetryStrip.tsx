import React from 'react';
import { Activity, ShieldCheck, Layers, Zap, Cpu } from 'lucide-react';

export const LandingTelemetryStrip: React.FC = () => {
  const stats = [
    {
      label: 'Deterministic Radix Tree',
      value: '100%',
      subtext: 'Zero calculation drift',
      icon: <Cpu className="w-5 h-5 text-purple-600" />,
    },
    {
      label: 'RFC 1918 Conflict Rate',
      value: '0.00%',
      subtext: 'Guaranteed pre-flight lock',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    },
    {
      label: 'IEEE 802.1Q VLAN Scope',
      value: '4,094',
      subtext: 'Trunked broadcast domains',
      icon: <Layers className="w-5 h-5 text-cyan-500" />,
    },
    {
      label: 'Rule Evaluation Latency',
      value: '< 0.2ms',
      subtext: 'In-memory graph engine',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
    },
    {
      label: 'Spatial 3D Digital Twin',
      value: 'Line-Rate',
      subtext: 'WebGL packet trajectory',
      icon: <Activity className="w-5 h-5 text-rose-500" />,
    },
  ];

  return (
    <section
      className="landing-telemetry-strip"
      style={{
        padding: '2.5rem 0',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="layout-container">
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem 2rem',
            boxShadow:
              '0 12px 32px rgba(124, 92, 191, 0.1), inset 1.5px 1.5px 2px #ffffff, inset -1px -1px 2px rgba(180, 165, 220, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.75rem',
            alignItems: 'center',
          }}
        >
          {stats.map((stat, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                borderRight: idx < stats.length - 1 ? '1px solid rgba(139, 92, 246, 0.15)' : 'none',
                paddingRight: '1rem',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(145deg, #ede7fb, #e0d4f7)',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>

              <div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: '#2d1f4e',
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.785rem', fontWeight: 800, color: '#2d1f4e', marginTop: '0.15rem' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6b5a8a' }}>
                  {stat.subtext}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
