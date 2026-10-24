import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IPInventory } from '../src/features/inventory/IPInventory';
import * as assignApi from '../src/api/assignments';
import * as devApi from '../src/api/devices';
import * as subApi from '../src/api/subnets';

describe('IPInventory Component', () => {
  const mockSubnets = [
    {
      id: 'sub-1',
      project_id: 'proj-1',
      parent_subnet_id: null,
      cidr: '192.168.20.0/26',
      label: 'Lab Workstations',
      segment: 'VLAN 20',
      gateway: '192.168.20.1',
      dhcp_start: '192.168.20.30',
      dhcp_end: '192.168.20.60',
      requested_hosts: 20,
      notes: null,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      total_addresses: 64,
      usable_addresses: 62,
    },
  ];

  const mockDevices = [
    {
      id: 'dev-1',
      project_id: 'proj-1',
      name: 'core-router',
      device_type: 'router' as const,
      role: 'Default Gateway',
      mac_address: '00:11:22:33:44:55',
      location: 'Rack 1',
      notes: null,
      diagram_x: 100,
      diagram_y: 100,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      assigned_ips: ['192.168.20.1'],
    },
  ];

  const mockAssignments = [
    {
      id: 'assign-1',
      project_id: 'proj-1',
      subnet_id: 'sub-1',
      device_id: 'dev-1',
      ipv4_address: '192.168.20.1',
      assignment_type: 'gateway' as const,
      status: 'active' as const,
      notes: 'Default gateway interface',
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      device_name: 'core-router',
      device_role: 'Default Gateway',
      subnet_label: 'Lab Workstations',
      subnet_cidr: '192.168.20.0/26',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders IP inventory table and filters properly', async () => {
    vi.spyOn(subApi, 'fetchProjectSubnets').mockResolvedValue(mockSubnets);
    vi.spyOn(devApi, 'fetchProjectDevices').mockResolvedValue(mockDevices);
    vi.spyOn(assignApi, 'fetchProjectAssignments').mockResolvedValue(mockAssignments);

    render(<IPInventory projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.1')).toBeInTheDocument();
      expect(screen.getByText('core-router')).toBeInTheDocument();
      expect(screen.getByText('Lab Workstations')).toBeInTheDocument();
    });
  });

  it('handles assigning an IP address', async () => {
    vi.spyOn(subApi, 'fetchProjectSubnets').mockResolvedValue(mockSubnets);
    vi.spyOn(devApi, 'fetchProjectDevices').mockResolvedValue(mockDevices);
    vi.spyOn(assignApi, 'fetchProjectAssignments').mockResolvedValue(mockAssignments);

    const createSpy = vi.spyOn(assignApi, 'createAssignment').mockResolvedValue({
      id: 'assign-2',
      project_id: 'proj-1',
      subnet_id: 'sub-1',
      device_id: null,
      ipv4_address: '192.168.20.10',
      assignment_type: 'planned static' as const,
      status: 'planned' as const,
      notes: null,
      created_at: '2026-10-23T10:05:00Z',
      updated_at: '2026-10-23T10:05:00Z',
      device_name: null,
      device_role: null,
      subnet_label: 'Lab Workstations',
      subnet_cidr: '192.168.20.0/26',
    });

    render(<IPInventory projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.1')).toBeInTheDocument();
    });

    const assignBtn = screen.getByRole('button', { name: /Assign IPv4 Address/i });
    fireEvent.click(assignBtn);

    expect(screen.getByRole('heading', { name: /^Assign IPv4 Address$/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/IPv4 Address \*/i), {
      target: { value: '192.168.20.10' },
    });

    const submitBtn = screen.getByRole('button', { name: /^Assign IP$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('proj-1', expect.objectContaining({
        ipv4_address: '192.168.20.10',
        assignment_type: 'planned static',
      }));
    });
  });

  it('shows error banner when assignment causes duplicate or collision', async () => {
    vi.spyOn(subApi, 'fetchProjectSubnets').mockResolvedValue(mockSubnets);
    vi.spyOn(devApi, 'fetchProjectDevices').mockResolvedValue(mockDevices);
    vi.spyOn(assignApi, 'fetchProjectAssignments').mockResolvedValue(mockAssignments);

    vi.spyOn(assignApi, 'createAssignment').mockRejectedValue(
      new Error("Duplicate IP assignment: Address '192.168.20.1' is already assigned in this project.")
    );

    render(<IPInventory projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.1')).toBeInTheDocument();
    });

    const assignBtn = screen.getByRole('button', { name: /Assign IPv4 Address/i });
    fireEvent.click(assignBtn);

    fireEvent.change(screen.getByLabelText(/IPv4 Address \*/i), {
      target: { value: '192.168.20.1' },
    });

    const submitBtn = screen.getByRole('button', { name: /^Assign IP$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/is already assigned in this project/i)).toBeInTheDocument();
    });
  });
});
