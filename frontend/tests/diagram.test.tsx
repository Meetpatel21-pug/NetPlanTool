import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NetworkDiagram } from '../src/features/diagram/NetworkDiagram';
import * as devApi from '../src/api/devices';
import * as linkApi from '../src/api/links';
import * as assignApi from '../src/api/assignments';
import * as subApi from '../src/api/subnets';

// Mock resize observer and matchMedia for React Flow in JSDOM
(globalThis as any).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('NetworkDiagram Component', () => {
  const mockDevices = [
    {
      id: 'dev-1',
      project_id: 'proj-1',
      name: 'core-router',
      device_type: 'router' as const,
      role: 'Core Gateway',
      mac_address: null,
      location: null,
      notes: null,
      diagram_x: 100,
      diagram_y: 100,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      assigned_ips: ['192.168.20.1'],
    },
    {
      id: 'dev-2',
      project_id: 'proj-1',
      name: 'edge-switch',
      device_type: 'switch' as const,
      role: 'Distribution',
      mac_address: null,
      location: null,
      notes: null,
      diagram_x: 250,
      diagram_y: 250,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      assigned_ips: [],
    },
  ];

  const mockLinks = [
    {
      id: 'link-1',
      project_id: 'proj-1',
      source_device_id: 'dev-1',
      target_device_id: 'dev-2',
      label: 'Trunk',
      speed_note: '10 Gbps',
      diagram_metadata: null,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      source_device_name: 'core-router',
      target_device_name: 'edge-switch',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders diagram with device palette and action buttons', async () => {
    vi.spyOn(devApi, 'fetchProjectDevices').mockResolvedValue(mockDevices);
    vi.spyOn(linkApi, 'fetchProjectLinks').mockResolvedValue(mockLinks);
    vi.spyOn(assignApi, 'fetchProjectAssignments').mockResolvedValue([]);
    vi.spyOn(subApi, 'fetchProjectSubnets').mockResolvedValue([]);

    render(<NetworkDiagram projectId="proj-1" />);

    expect(screen.getByText('Network Topology Diagram')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Layout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export PNG/i })).toBeInTheDocument();
    expect(screen.getByText('+ Router')).toBeInTheDocument();
    expect(screen.getByText('+ Switch')).toBeInTheDocument();
    expect(screen.getByText('+ Server')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('core-router')).toBeInTheDocument();
      expect(screen.getByText('edge-switch')).toBeInTheDocument();
    });
  });

  it('allows adding a device from palette', async () => {
    vi.spyOn(devApi, 'fetchProjectDevices').mockResolvedValue(mockDevices);
    vi.spyOn(linkApi, 'fetchProjectLinks').mockResolvedValue(mockLinks);
    vi.spyOn(assignApi, 'fetchProjectAssignments').mockResolvedValue([]);
    vi.spyOn(subApi, 'fetchProjectSubnets').mockResolvedValue([]);

    const createDevSpy = vi.spyOn(devApi, 'createDevice').mockResolvedValue({
      id: 'dev-3',
      project_id: 'proj-1',
      name: 'server-1',
      device_type: 'server' as const,
      role: 'Host',
      mac_address: null,
      location: null,
      notes: null,
      diagram_x: 300,
      diagram_y: 300,
      created_at: '2026-10-23T10:10:00Z',
      updated_at: '2026-10-23T10:10:00Z',
      assigned_ips: [],
    });

    render(<NetworkDiagram projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('core-router')).toBeInTheDocument();
    });

    const addServerBtn = screen.getByRole('button', { name: /\+ Server/i });
    fireEvent.click(addServerBtn);

    expect(screen.getByText(/Add server to Canvas/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Add to Canvas/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createDevSpy).toHaveBeenCalledWith('proj-1', expect.objectContaining({
        name: 'server-1',
        device_type: 'server',
      }));
    });
  });

  it('persists layout coordinates on Save Layout', async () => {
    vi.spyOn(devApi, 'fetchProjectDevices').mockResolvedValue(mockDevices);
    vi.spyOn(linkApi, 'fetchProjectLinks').mockResolvedValue(mockLinks);
    vi.spyOn(assignApi, 'fetchProjectAssignments').mockResolvedValue([]);
    vi.spyOn(subApi, 'fetchProjectSubnets').mockResolvedValue([]);

    const saveSpy = vi.spyOn(linkApi, 'saveDiagramLayout').mockResolvedValue();

    render(<NetworkDiagram projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('core-router')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /Save Layout/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith('proj-1', expect.arrayContaining([
        expect.objectContaining({ device_id: 'dev-1' }),
        expect.objectContaining({ device_id: 'dev-2' }),
      ]));
    });
  });
});
