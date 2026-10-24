import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { NetworkDiagram } from '../src/features/diagram/NetworkDiagram';
import { DeviceNode } from '../src/features/diagram/DeviceNode';
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

  it('renders DeviceNode with separated source and target handles preventing overlap', () => {
    const { container } = render(
      <ReactFlowProvider>
        <DeviceNode
          id="dev-node-1"
          data={{
            device: mockDevices[0],
            ip: '192.168.20.1',
            subnetLabel: 'Lab Subnet'
          }}
          selected={false}
          selectable={true}
          deletable={true}
          draggable={true}
          type="deviceNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
        />
      </ReactFlowProvider>
    );

    const targetHandles = container.querySelectorAll('.diagram-handle-target');
    const sourceHandles = container.querySelectorAll('.diagram-handle-source');
    expect(targetHandles.length).toBe(4);
    expect(sourceHandles.length).toBe(4);

    const topTarget = (container.querySelector('[data-handleid="top-t"]') || container.querySelector('#top-t')) as HTMLElement;
    const topSource = (container.querySelector('[data-handleid="top-s"]') || container.querySelector('#top-s')) as HTMLElement;
    expect(topTarget).not.toBeNull();
    expect(topSource).not.toBeNull();
    expect(topTarget.style.left).toBe('35%');
    expect(topSource.style.left).toBe('65%');

    const leftTarget = (container.querySelector('[data-handleid="left-t"]') || container.querySelector('#left-t')) as HTMLElement;
    const leftSource = (container.querySelector('[data-handleid="left-s"]') || container.querySelector('#left-s')) as HTMLElement;
    expect(leftTarget).not.toBeNull();
    expect(leftSource).not.toBeNull();
    expect(leftTarget.style.top).toBe('35%');
    expect(leftSource.style.top).toBe('65%');
  });

  it('toggles canvas fullscreen mode and excludes MiniMap', async () => {
    vi.spyOn(devApi, 'fetchProjectDevices').mockResolvedValue(mockDevices);
    vi.spyOn(linkApi, 'fetchProjectLinks').mockResolvedValue(mockLinks);
    vi.spyOn(assignApi, 'fetchProjectAssignments').mockResolvedValue([]);
    vi.spyOn(subApi, 'fetchProjectSubnets').mockResolvedValue([]);

    const { container } = render(<NetworkDiagram projectId="proj-1" />);

    // Verify MiniMap is removed from the DOM
    expect(container.querySelector('.react-flow__minimap')).toBeNull();

    // Verify fullscreen button exists in toolbar and controls
    const fsToolbarBtn = screen.getByRole('button', { name: /Fullscreen Canvas/i });
    expect(fsToolbarBtn).toBeInTheDocument();

    const fsControlBtn = screen.getByRole('button', { name: /Toggle Fullscreen/i });
    expect(fsControlBtn).toBeInTheDocument();

    // Toggle fullscreen via control button
    fireEvent.click(fsControlBtn);

    await waitFor(() => {
      const exitBtns = screen.getAllByRole('button', { name: /Exit Fullscreen/i });
      expect(exitBtns.length).toBeGreaterThan(0);
      const canvasBox = container.querySelector('.react-flow-clay-canvas');
      expect(canvasBox).toHaveClass('is-fullscreen');
    });

    // Toggle exit fullscreen
    const exitBtns = screen.getAllByRole('button', { name: /Exit Fullscreen/i });
    fireEvent.click(exitBtns[0]);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Exit Fullscreen/i })).toBeNull();
      const canvasBox = container.querySelector('.react-flow-clay-canvas');
      expect(canvasBox).not.toHaveClass('is-fullscreen');
    });
  });
});

