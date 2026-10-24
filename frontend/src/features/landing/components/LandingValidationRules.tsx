import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Layers,
  Network,
} from 'lucide-react';

interface RuleCard {
  id: string;
  title: string;
  status: 'passed' | 'warning' | 'active';
  description: string;
  details: string;
  rfcStandard: string;
  icon: React.ReactNode;
}

export const LandingValidationRules: React.FC = () => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('duplicate-ip');

  const rules: RuleCard[] = [
    {
      id: 'duplicate-ip',
      title: 'Duplicate IP Prevention',
      status: 'passed',
      description:
        'Continuous deterministic scanning ensuring no two network interfaces, physical servers, or virtual IPs share identical IP host bits.',
      details:
        'Checks ARP tables, DHCP reservation pools, and static device inventories before allowing configuration commits.',
      rfcStandard: 'RFC 1918 / RFC 791',
      icon: <Network className="w-5 h-5 text-emerald-500" />,
    },
    {
      id: 'subnet-overlap',
      title: 'Subnet Boundary & Sibling Overlap',
      status: 'passed',
      description:
        'Mathematical verification that sibling CIDR blocks do not interleave or collide within their parent allocation boundaries.',
      details:
        'Analyzes bitmask prefix lengths and start/end boundaries, preventing split-brain routing and dropped packets.',
      rfcStandard: 'RFC 4632 (CIDR)',
      icon: <Layers className="w-5 h-5 text-purple-600" />,
    },
    {
      id: 'gateway-invalidation',
      title: 'Gateway Range Invalidation',
      status: 'passed',
      description:
        'Guarantees the assigned default gateway resides strictly within the usable host address pool and avoids network or broadcast boundaries.',
      details:
        'Flagging assignments on host index .0 (network) or .255 (broadcast) with immediate visual warnings.',
      rfcStandard: 'RFC 1812 (Routers)',
      icon: <ShieldAlert className="w-5 h-5 text-cyan-600" />,
    },
  ];

  return (
    <section
      className="landing-validation-section"
      style={{
        paddingTop: '3.5rem',
        paddingBottom: '4.5rem',
        position: 'relative',
      }}
    >
      <div className="layout-container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              boxShadow: 'var(--clay-shadow-sm)',
              marginBottom: '1rem',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
            }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-white)' }}>
              Zero Downtime Deployment Protection
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--text-white)',
              lineHeight: 1.15,
            }}
          >
            Built-in Pre-Implementation Validation Engine
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              marginTop: '0.75rem',
              lineHeight: 1.6,
            }}
          >
            Catch subnet collisions, gateway range violations, and duplicate host assignments before 
            generating configuration files or deploying to hardware.
          </p>
        </div>

        {/* 3 Interactive Rule Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {rules.map((rule) => {
            const isSelected = selectedRuleId === rule.id;
            return (
              <div
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                className="clay-card-interactive"
                style={{
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-xl)',
                  background: isSelected
                    ? 'rgba(255, 255, 255, 0.96)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: isSelected ? 'var(--clay-shadow-md)' : 'var(--clay-shadow-sm)',
                  border: isSelected
                    ? '2px solid rgba(155, 109, 255, 0.6)'
                    : '1.5px solid rgba(255, 255, 255, 0.95)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(155, 109, 255, 0.12)',
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      {rule.icon}
                    </div>

                    <span
                      className="brand-tag"
                      style={{
                        background: 'linear-gradient(145deg, #10b981, #059669)',
                        color: '#ffffff',
                        fontSize: '0.725rem',
                        padding: '0.2rem 0.6rem',
                      }}
                    >
                      PRE-FLIGHT PASS
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--text-white)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {rule.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '1rem',
                    }}
                  >
                    {rule.description}
                  </p>
                </div>

                <div
                  style={{
                    paddingTop: '0.85rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {rule.rfcStandard}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-white)',
                      }}
                    >
                      Active Guard
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation Action Banner */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(240, 238, 252, 0.9))',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 2rem',
            boxShadow: 'var(--clay-shadow-sm)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 12px #10b981',
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#2d1f4e' }}>
              Validation Status: 0 Warnings • 0 Collisions Detected
            </span>
          </div>

          <Link
            to="/projects?tab=validation"
            className="btn-clay-primary magnetic-btn"
            style={{
              padding: '0.6rem 1.4rem',
              fontSize: '0.85rem',
              borderRadius: '999px',
              width: 'auto',
              flexShrink: 0,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Run Pre-Flight Audit Engine</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
