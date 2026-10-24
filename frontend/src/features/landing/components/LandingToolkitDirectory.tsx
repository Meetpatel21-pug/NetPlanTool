import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  FolderGit2,
  Layers,
  Server,
  Share2,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

interface ToolCard {
  id: string;
  title: string;
  description: string;
  route: string;
  badge: string;
  icon: React.ReactNode;
  color: string;
}

export const LandingToolkitDirectory: React.FC = () => {
  const tools: ToolCard[] = [
    {
      id: 'calculator',
      title: 'Subnet Calculator',
      description:
        'Instant binary bitmask analysis, usable host calculation, CIDR prefix conversions, and broadcast address identification.',
      route: '/calculator',
      badge: 'Standalone Tool',
      icon: <Calculator className="w-6 h-6 text-purple-600" />,
      color: '#9b6dff',
    },
    {
      id: 'projects',
      title: 'Project Workspaces',
      description:
        'Manage end-to-end network planning projects with blank templates, sample topologies, and team collaboration.',
      route: '/projects',
      badge: 'Project Hub',
      icon: <FolderGit2 className="w-6 h-6 text-indigo-600" />,
      color: '#6366f1',
    },
    {
      id: 'subnets',
      title: 'Subnet Allocation Planner',
      description:
        'Hierarchical subnet trees with deterministic /16 to /30 carving, parent-child inheritance, and VLAN assignments.',
      route: '/projects?tab=subnets',
      badge: 'Core Engine',
      icon: <Layers className="w-6 h-6 text-emerald-600" />,
      color: '#10b981',
    },
    {
      id: 'inventory',
      title: 'IP Address & Device Inventory',
      description:
        'Hardware inventory tracking routers, managed switches, servers, workstations, and APs with static IP assignments.',
      route: '/projects?tab=inventory',
      badge: 'Deterministic IPAM',
      icon: <Server className="w-6 h-6 text-cyan-600" />,
      color: '#06b6d4',
    },
    {
      id: 'diagram',
      title: 'Interactive Topology Diagram',
      description:
        'Visual network diagram powered by React Flow with drag-and-drop hardware devices, trunk links, and collision indicators.',
      route: '/projects?tab=diagram',
      badge: 'React Flow Canvas',
      icon: <Share2 className="w-6 h-6 text-amber-500" />,
      color: '#f59e0b',
    },
    {
      id: 'validation',
      title: 'Automated Conflict Validation',
      description:
        'Real-time validation engine verifying subnet non-overlap, gateway inclusion, DHCP pool boundaries, and host capacity.',
      route: '/projects?tab=validation',
      badge: 'Pre-Flight Engine',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
      color: '#10b981',
    },
    {
      id: 'reports',
      title: 'Audit & Export Reports',
      description:
        'Generate comprehensive network documentation briefs with printable layout and export IP assignments directly to CSV.',
      route: '/projects?tab=reports',
      badge: 'PDF / CSV Export',
      icon: <FileSpreadsheet className="w-6 h-6 text-purple-500" />,
      color: '#b088f9',
    },
  ];

  return (
    <section
      className="landing-toolkit-section"
      style={{
        paddingTop: '3.5rem',
        paddingBottom: '5rem',
        position: 'relative',
      }}
    >
      <div className="layout-container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem' }}>
          <span
            className="brand-tag"
            style={{
              background: 'linear-gradient(135deg, #9b6dff, #06b6d4)',
              color: '#ffffff',
              marginBottom: '1rem',
              display: 'inline-block',
            }}
          >
            MODULAR ENTERPRISE ARCHITECTURE
          </span>

          <h2
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 2.75rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--text-white)',
              lineHeight: 1.15,
            }}
          >
            Explore the Complete Toolkit Directory
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              marginTop: '0.75rem',
              lineHeight: 1.6,
            }}
          >
            Every component is purpose-built to deliver deterministic, error-free network infrastructure.
          </p>
        </div>

        {/* Directory Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.route}
              className="clay-card-interactive"
              style={{
                textDecoration: 'none',
                padding: '1.75rem',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(16px)',
                boxShadow: 'var(--clay-shadow-sm)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all var(--transition-fast)',
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
                    {tool.icon}
                  </div>

                  <span
                    className="brand-tag"
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.55rem',
                    }}
                  >
                    {tool.badge}
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
                  {tool.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginBottom: '1.25rem',
                  }}
                >
                  {tool.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: tool.color,
                }}
              >
                <span>Launch Tool Module</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
