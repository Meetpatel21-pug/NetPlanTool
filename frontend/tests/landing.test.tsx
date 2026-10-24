import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../src/features/landing/LandingPage';
import { NetworkSceneFallback } from '../src/features/landing/components/NetworkSceneFallback';

describe('LandingPage Component', () => {
  it('renders landing page hero with headline and primary actions', () => {
    render(
      
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Design Networks\./i)).toBeInTheDocument();
    expect(screen.getByText(/Master Every Subnet\./i)).toBeInTheDocument();
    const ctaLinks = screen.getAllByRole('link', { name: /Launch Project Workspace/i });
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: /Open Subnet Calculator/i })).toBeInTheDocument();
  });

  it('renders complete tool directory linking to all real application routes', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Explore the Complete Toolkit Directory')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subnet Calculator' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project Workspaces' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subnet Allocation Planner' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'IP Address & Device Inventory' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Interactive Topology Diagram' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Automated Conflict Validation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Audit & Export Reports' })).toBeInTheDocument();
  });

  it('renders automated conflict validation rule cards', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Built-in Pre-Implementation Validation Engine')).toBeInTheDocument();
    expect(screen.getByText('Duplicate IP Prevention')).toBeInTheDocument();
    expect(screen.getByText('Subnet Boundary & Sibling Overlap')).toBeInTheDocument();
    expect(screen.getByText('Gateway Range Invalidation')).toBeInTheDocument();
  });

  it('renders NetworkSceneFallback gracefully for non-WebGL environments', () => {
    const mockDevices = [
      {
        id: 'test-router',
        name: 'test-router-01',
        type: 'router' as const,
        role: 'Gateway',
        ip: '192.168.1.1',
        subnet: '192.168.1.0/24',
        status: 'active' as const,
        position: [0, 0, 0] as [number, number, number],
      },
    ];

    const mockZones = [
      {
        id: 'test-zone',
        name: 'Core Zone',
        cidr: '192.168.1.0/24',
        color: 0x9b6dff,
        center: [0, 0, 0] as [number, number, number],
        size: [2, 2] as [number, number],
      },
    ];

    render(<NetworkSceneFallback devices={mockDevices} zones={mockZones} />);

    expect(screen.getByText('test-router-01')).toBeInTheDocument();
    const ipElements = screen.getAllByText('192.168.1.1');
    expect(ipElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Topology Layout')).toBeInTheDocument();
  });
});
