import React from 'react';
import { Check, X, Zap } from 'lucide-react';

interface ComparisonRow {
  dimension: string;
  traditional: string;
  netPlan: string;
  advantage: string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: 'Address Space Allocation',
    traditional: 'Manual entry into static Excel / Google Sheets with high risk of human calculation typos.',
    netPlan: 'Deterministic Radix Tree with instant binary boundary calculation and collision lockouts.',
    advantage: '100% Deterministic Guarantee',
  },
  {
    dimension: 'Overlapping Subnet Detection',
    traditional: 'Discovered only after deployment when routing conflicts and duplicate ARP packets take down services.',
    netPlan: 'Pre-Flight RFC 1918 validation engine rejects overlapping host ranges in sub-millisecond execution.',
    advantage: 'Pre-Deployment Elimination',
  },
  {
    dimension: 'Topology Modeling',
    traditional: 'Static Visio / Lucidchart diagrams that quickly drift out of sync with real IP assignments.',
    netPlan: 'Interactive 3D WebGL spatial canvas with live packet flow simulations and real device drawer inspection.',
    advantage: 'Living Spatial Digital Twin',
  },
  {
    dimension: 'Multi-Tier VLSM Partitioning',
    traditional: 'Tedious pen-and-paper or web calculators without hierarchical parent/child tracking.',
    netPlan: 'Visual hierarchical tree breakdown showing exact host capacities, network boundaries, and broadcast addresses.',
    advantage: '1-Click Tier Decomposition',
  },
  {
    dimension: 'Compliance & Audit Exports',
    traditional: 'Hours spent cobbling together screenshots and manual summaries for security auditors.',
    netPlan: 'Instant audit brief generation with printable presentation layout and one-click RFC 1918 CSV exports.',
    advantage: 'Instant Audit Readiness',
  },
];

export const LandingArchitectureComparison: React.FC = () => {
  return (
    <section
      className="landing-comparison-section"
      style={{
        paddingTop: '3.5rem',
        paddingBottom: '4.5rem',
        position: 'relative',
      }}
    >
      <div className="layout-container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.94)',
              padding: '0.45rem 1.15rem',
              borderRadius: '999px',
              boxShadow: '4px 6px 16px rgba(124, 92, 191, 0.1), inset 1px 1px 2px #ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              marginBottom: '1rem',
            }}
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#2d1f4e' }}>
              ENTERPRISE BENCHMARK COMPARISON
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#2d1f4e',
              marginBottom: '0.75rem',
            }}
          >
            Traditional IPAM vs. NetPlan Spatial Suite
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#5e4e7e',
              lineHeight: 1.6,
            }}
          >
            See how deterministic CIDR math and 3D spatial topology visualization eliminate network downtime, human error, and compliance headaches.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow:
              '0 16px 40px rgba(124, 92, 191, 0.1), inset 2px 2px 4px #ffffff, inset -2px -2px 4px rgba(180, 165, 220, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'separate', borderSpacing: '0 0.85rem' }}>
            <thead>
              <tr style={{ color: '#2d1f4e', fontSize: '0.9rem', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, width: '24%' }}>Architectural Dimension</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, width: '38%', color: '#9b2c2c' }}>
                  Legacy Spreadsheets & Static Diagrams
                </th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 900, width: '38%', color: '#6d28d9' }}>
                  NetPlan Deterministic Spatial Suite
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? 'rgba(247, 244, 252, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 2px 8px rgba(124, 92, 191, 0.04)',
                  }}
                >
                  <td style={{ padding: '1.1rem 1.25rem', borderRadius: '12px 0 0 12px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2d1f4e' }}>{row.dimension}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, marginTop: '0.2rem' }}>
                      {row.advantage}
                    </div>
                  </td>

                  <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.85rem', color: '#742a2a', lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{row.traditional}</span>
                    </div>
                  </td>

                  <td style={{ padding: '1.1rem 1.25rem', borderRadius: '0 12px 12px 0', fontSize: '0.875rem', color: '#2d1f4e', lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <strong>{row.netPlan}</strong>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
