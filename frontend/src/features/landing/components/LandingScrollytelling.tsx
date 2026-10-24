import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Layers,
  Maximize2,
  Minimize2,
  ChevronRight,
  ExternalLink,
  Shield,
  Activity,
  Cpu,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { NetworkScene3D } from './NetworkScene3D';
import { NetworkDeviceData } from '../models/NetworkModels';

export interface StoryChapter {
  id: string;
  phase: string;
  title: string;
  description: string;
  badgeColor: string;
  specs: { label: string; value: string }[];
  actionText: string;
  actionRoute: string;
  actionIcon: React.ReactNode;
}

interface LandingScrollytellingProps {
  scrollProgress?: number;
}

export const LandingScrollytelling: React.FC<LandingScrollytellingProps> = ({ scrollProgress: externalProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDeviceData | null>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [internalScrollProgress, setInternalScrollProgress] = useState<number>(0);

  const chapters: StoryChapter[] = [
    {
      id: 'gateway',
      phase: 'SCENE 1 • CORE INFRASTRUCTURE',
      title: 'The Border Gateway & Backbone',
      description:
        'Dual-WAN border router with hardware crypto-acceleration, 10Gbps optical uplink, and live OLED diagnostics.',
      badgeColor: 'linear-gradient(135deg, #9b6dff, #7c3aed)',
      specs: [
        { label: 'Gateway IP', value: '192.168.1.1/24' },
        { label: 'Uplink Speed', value: '10 Gbps SFP+' },
      ],
      actionText: 'Inspect in IP Inventory',
      actionRoute: '/projects?tab=inventory',
      actionIcon: <Server className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'subnets',
      phase: 'SCENE 2 • NETWORK MICRO-SEGMENTATION',
      title: 'High-Density VLAN Distribution',
      description:
        '24-Port Gigabit managed switch tier isolating engineering, executive staff, and IoT subnets with zero route collisions.',
      badgeColor: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      specs: [
        { label: 'Switch IP', value: '192.168.1.2/24' },
        { label: 'VLAN Allocation', value: 'VLAN 10, 20, 30' },
      ],
      actionText: 'Open Subnet Planner',
      actionRoute: '/projects?tab=subnets',
      actionIcon: <Layers className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'server-rack',
      phase: 'SCENE 3 • RACK DATACENTER',
      title: 'High-Availability Application Cluster',
      description:
        'Redundant dual-socket datacenter servers hosting internal DNS, DHCP pools, active directory, and SQL database backends.',
      badgeColor: 'linear-gradient(135deg, #10b981, #059669)',
      specs: [
        { label: 'Server IP', value: '192.168.10.10/24' },
        { label: 'Storage Tier', value: 'NVMe RAID-10' },
      ],
      actionText: 'View Topology Diagram',
      actionRoute: '/projects?tab=diagram',
      actionIcon: <Cpu className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'edge-fleet',
      phase: 'SCENE 4 • ACCESS & CLIENT FLEET',
      title: 'Converged Workstations & Wi-Fi 6E',
      description:
        'High-density wireless access points with 360° Fresnel halo indicators, engineered workstations, and network laser printers.',
      badgeColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
      specs: [
        { label: 'AP Subnet', value: '192.168.1.30/24' },
        { label: 'DHCP Range', value: '.50 - .250' },
      ],
      actionText: 'Verify Pre-Flight Rules',
      actionRoute: '/projects?tab=validation',
      actionIcon: <Shield className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'converged',
      phase: 'SCENE 5 • CONVERGED OVERVIEW',
      title: 'Total Spatial Network Health',
      description:
        'Holistic 3D architectural overview with real-time packet stream trajectories, capacity bitmasks, and conflict validation.',
      badgeColor: 'linear-gradient(135deg, #ec4899, #be185d)',
      specs: [
        { label: 'Total Endpoints', value: '6 Devices' },
        { label: 'Validation Score', value: '100% Passed' },
      ],
      actionText: 'Export Audit Brief',
      actionRoute: '/projects?tab=reports',
      actionIcon: <Activity className="w-4 h-4 text-purple-600" />,
    },
  ];

  // Map external scroll progress if provided
  useEffect(() => {
    if (externalProgress !== undefined && externalProgress > 0) {
      const idx = Math.min(Math.floor(externalProgress * chapters.length), chapters.length - 1);
      setActiveChapterIdx(idx);
      setInternalScrollProgress(externalProgress);
    }
  }, [externalProgress, chapters.length]);

  // Window scroll event listener for seamless natural scrollytelling
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // When the scrollytelling section moves through the viewport
      const totalDistance = rect.height + windowHeight * 0.8;
      const currentDistance = windowHeight - rect.top;
      const rawProgress = currentDistance / totalDistance;
      const clamped = Math.max(0, Math.min(1, rawProgress));

      setInternalScrollProgress(clamped);
      const chapterIdx = Math.min(Math.floor(clamped * chapters.length), chapters.length - 1);
      setActiveChapterIdx(chapterIdx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapters.length]);

  // Fullscreen Esc Key Listener & Body Overflow Locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return next;
    });
  };

  const currentChapter = chapters[activeChapterIdx];
  const activeProgress = internalScrollProgress;

  return (
    <div
      ref={containerRef}
      className="hero-3d-fullspace-container scrollytell-seamless-stage"
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        height: 'clamp(600px, 76vh, 800px)',
        background: 'transparent',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient Purple & Cyan Glow Highlights matching Image 3 */}
      <div
        style={{
          position: 'absolute',
          width: '560px',
          height: '560px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 130, 245, 0.22) 0%, transparent 70%)',
          filter: 'blur(55px)',
          top: '10%',
          left: '18%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, transparent 70%)',
          filter: 'blur(50px)',
          bottom: '8%',
          right: '16%',
          pointerEvents: 'none',
        }}
      />

      {/* Transparent Seamless 3D Scrollytelling Canvas (Without Box) */}
      {!isFullScreen && (
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <NetworkScene3D
            scrollProgress={activeProgress}
            onSelectDevice={setSelectedDevice}
            selectedDeviceId={selectedDevice?.id}
          />
        </div>
      )}

      {/* Floating Detail Badges (Exact layout & details of Image 3) */}
      {/* 1. TOP-LEFT FLOATING STATUS CHIP */}
      <div
        className="clay-badge-float scrollytell-chapter-chip"
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          padding: '0.6rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '4px 6px 16px rgba(124, 92, 191, 0.1), inset 1px 1px 2px #ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.825rem',
          fontWeight: 700,
          color: '#2d1f4e',
          zIndex: 20,
        }}
      >
        <span
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981',
            display: 'inline-block',
          }}
        />
        <span>{currentChapter.phase}</span>
      </div>

      {/* 2. TOP-RIGHT FLOATING SCENE NAVIGATION PILLS & FULLSCREEN TOGGLE */}
      <div
        className="scrollytell-top-bar"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          zIndex: 20,
          flexWrap: 'wrap',
        }}
      >
        <div
          className="scrollytell-tabs-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(16px)',
            padding: '0.35rem 0.45rem',
            borderRadius: '999px',
            boxShadow: '4px 6px 16px rgba(124, 92, 191, 0.1), inset 1px 1px 2px #ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
          }}
        >
          {['1. Gateway', '2. Subnets', '3. Topology', '4. Validation', '5. Overview'].map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setActiveChapterIdx(idx);
                setInternalScrollProgress((idx + 0.5) / chapters.length);
              }}
              className={`story-tab-btn ${activeChapterIdx === idx ? 'active' : ''}`}
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: activeChapterIdx === idx ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                color: activeChapterIdx === idx ? '#ffffff' : '#5e4e7e',
                fontWeight: activeChapterIdx === idx ? 800 : 600,
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleFullScreen}
          className="magnetic-btn"
          title={isFullScreen ? 'Exit Fullscreen (Esc)' : 'Expand Fullscreen Canvas'}
          aria-label={isFullScreen ? 'Exit Fullscreen' : 'Expand Fullscreen Canvas'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 0.95rem',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            boxShadow: '4px 6px 16px rgba(124, 92, 191, 0.1), inset 1px 1px 2px #ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            cursor: 'pointer',
            fontSize: '0.785rem',
            fontWeight: 700,
            color: '#2d1f4e',
          }}
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-purple-600" />
              <span>Exit</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-purple-600" />
              <span>Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {/* Selected Device Drawer inside 3D stage */}
      {selectedDevice && !isFullScreen && (
        <div
          className="scrollytell-device-drawer"
          style={{
            position: 'absolute',
            top: '5rem',
            right: '1.75rem',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 12px 28px rgba(124, 92, 191, 0.16)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            zIndex: 35,
            maxWidth: '340px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                background: 'rgba(155, 109, 255, 0.15)',
                padding: '0.35rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Cpu className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#2d1f4e', fontSize: '0.85rem' }}>
                {selectedDevice.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#6b5a8a' }}>
                {selectedDevice.role} • {selectedDevice.ip}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <Link
              to="/projects?tab=inventory"
              className="btn-clay-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', borderRadius: '999px' }}
            >
              Inventory
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={() => setSelectedDevice(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b5a8a',
                fontSize: '0.85rem',
                padding: '0.2rem',
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. BOTTOM SPANNING FLOATING TELEMETRY BAR (Exact layout of Image 3) */}
      <div
        className="scrollytell-bottom-bar"
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          right: 'max(1.75rem, calc((100vw - 1320px) / 2 + 1.75rem))',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '0.85rem 1.4rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '4px 8px 20px rgba(124, 92, 191, 0.12), inset 1px 1px 2px #ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              background: 'linear-gradient(145deg, #ede7fb, #e0d4f7)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentChapter.actionIcon}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2d1f4e' }}>
              {currentChapter.title}
            </div>
            <div className="scrollytell-desc" style={{ fontSize: '0.75rem', color: '#6b5a8a', marginTop: '0.1rem' }}>
              {currentChapter.specs.map((s) => `${s.label}: ${s.value}`).join(' • ')} — {currentChapter.description}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2d1f4e' }}>
              RFC 1918 Verified • 0 Collisions
            </span>
          </div>

          <Link
            to={currentChapter.actionRoute}
            className="btn-clay-secondary magnetic-btn"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.785rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              textDecoration: 'none',
              cursor: 'pointer',
              width: 'auto',
            }}
          >
            <span>{currentChapter.actionText}</span>
            <ChevronRight className="w-4 h-4 text-purple-600" />
          </Link>
        </div>
      </div>

      {/* Fullscreen Overlay Portal (Unclipped from sticky container) */}
      {isFullScreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 999999,
              background: 'linear-gradient(145deg, #ffffff 0%, #f6f2fc 100%)',
              overflow: 'hidden',
            }}
          >
            {/* Fullscreen Top Floating Bar */}
            <div
              style={{
                position: 'absolute',
                top: '1.5rem',
                left: '2rem',
                right: '2rem',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                padding: '0.75rem 1.4rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 32px rgba(124, 92, 191, 0.15)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2d1f4e' }}>
                  {currentChapter.title} • {currentChapter.phase}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {['1. Gateway', '2. Subnets', '3. Topology', '4. Validation', '5. Overview'].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveChapterIdx(idx);
                        setInternalScrollProgress((idx + 0.5) / chapters.length);
                      }}
                      className={`story-tab-btn ${activeChapterIdx === idx ? 'active' : ''}`}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeChapterIdx === idx ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'transparent',
                        color: activeChapterIdx === idx ? '#ffffff' : '#5e4e7e',
                        fontWeight: activeChapterIdx === idx ? 800 : 600,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={toggleFullScreen}
                  className="story-tab-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    background: 'rgba(232, 112, 136, 0.15)',
                    color: '#e87088',
                    fontWeight: 800,
                    border: '1.5px solid rgba(232, 112, 136, 0.4)',
                    cursor: 'pointer',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                  }}
                >
                  <Minimize2 className="w-4 h-4 text-rose-500" />
                  <span>Exit (Esc)</span>
                </button>
              </div>
            </div>

            {/* Fullscreen 3D Scene */}
            <div style={{ width: '100%', height: '100%' }}>
              <NetworkScene3D
                scrollProgress={activeProgress}
                onSelectDevice={setSelectedDevice}
                selectedDeviceId={selectedDevice?.id}
              />
            </div>

            {/* Fullscreen Bottom Bar */}
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '2rem',
                right: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                padding: '0.85rem 1.4rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 32px rgba(124, 92, 191, 0.15)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                zIndex: 90,
              }}
            >
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {currentChapter.specs.map((spec, sIdx) => (
                  <div key={sIdx} style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: '#6b5a8a', marginRight: '0.35rem' }}>{spec.label}:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#2d1f4e' }}>{spec.value}</strong>
                  </div>
                ))}
              </div>

              <Link
                to={currentChapter.actionRoute}
                className="btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', width: 'auto' }}
              >
                {currentChapter.actionIcon}
                <span style={{ marginLeft: '0.35rem' }}>{currentChapter.actionText}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
