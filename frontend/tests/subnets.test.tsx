import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubnetPlanner } from '../src/features/subnets/SubnetPlanner';
import * as api from '../src/api/subnets';

describe('SubnetPlanner Component', () => {
  const mockSubnets = [
    {
      id: 'sub-parent',
      project_id: 'proj-1',
      parent_subnet_id: null,
      cidr: '192.168.20.0/24',
      label: 'Corporate Supernet',
      segment: 'VLAN 10',
      gateway: '192.168.20.1',
      dhcp_start: null,
      dhcp_end: null,
      requested_hosts: 200,
      notes: null,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      network_address: '192.168.20.0',
      broadcast_address: '192.168.20.255',
      netmask: '255.255.255.0',
      total_addresses: 256,
      usable_addresses: 254,
      usable_range: '192.168.20.1 - 192.168.20.254',
      capacity_warning: null,
    },
    {
      id: 'sub-child',
      project_id: 'proj-1',
      parent_subnet_id: 'sub-parent',
      cidr: '192.168.20.0/26',
      label: 'Lab Workstations',
      segment: 'VLAN 20',
      gateway: '192.168.20.1',
      dhcp_start: '192.168.20.10',
      dhcp_end: '192.168.20.50',
      requested_hosts: 80, // Exceeds 62 usable
      notes: null,
      created_at: '2026-10-23T10:05:00Z',
      updated_at: '2026-10-23T10:05:00Z',
      network_address: '192.168.20.0',
      broadcast_address: '192.168.20.63',
      netmask: '255.255.255.192',
      total_addresses: 64,
      usable_addresses: 62,
      usable_range: '192.168.20.1 - 192.168.20.62',
      capacity_warning: 'Requested host capacity (80) exceeds usable subnet capacity (62 usable hosts for /26).',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders subnets table with hierarchy and capacity warnings', async () => {
    vi.spyOn(api, 'fetchProjectSubnets').mockResolvedValue(mockSubnets);

    render(<SubnetPlanner projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.0/24')).toBeInTheDocument();
      expect(screen.getByText('Corporate Supernet')).toBeInTheDocument();
      expect(screen.getByText('192.168.20.0/26')).toBeInTheDocument();
      expect(screen.getByText('Lab Workstations')).toBeInTheDocument();
      expect(screen.getByText('Exceeds capacity')).toBeInTheDocument();
    });
  });

  it('handles child subnet creation', async () => {
    vi.spyOn(api, 'fetchProjectSubnets').mockResolvedValue(mockSubnets);
    const createSpy = vi.spyOn(api, 'createSubnet').mockResolvedValue({
      id: 'sub-child-2',
      project_id: 'proj-1',
      parent_subnet_id: 'sub-parent',
      cidr: '192.168.20.64/26',
      label: 'Staff WiFi',
      segment: 'VLAN 30',
      gateway: '192.168.20.65',
      dhcp_start: null,
      dhcp_end: null,
      requested_hosts: 40,
      notes: null,
      created_at: '2026-10-23T10:10:00Z',
      updated_at: '2026-10-23T10:10:00Z',
      total_addresses: 64,
      usable_addresses: 62,
    });

    render(<SubnetPlanner projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Corporate Supernet')).toBeInTheDocument();
    });

    // Click "Child" button on the parent row
    const childBtns = screen.getAllByRole('button', { name: /Child/i });
    fireEvent.click(childBtns[0]);

    // Modal opens
    expect(screen.getByText(/Allocate Child Subnet/i)).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Subnet CIDR \*/i), {
      target: { value: '192.168.20.64/26' },
    });
    fireEvent.change(screen.getByLabelText(/Label \/ Name \*/i), {
      target: { value: 'Staff WiFi' },
    });

    const submitBtn = screen.getByRole('button', { name: /^Allocate Subnet$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('proj-1', expect.objectContaining({
        cidr: '192.168.20.64/26',
        label: 'Staff WiFi',
        parent_subnet_id: 'sub-parent',
      }));
    });
  });

  it('displays validation error when server rejects overlapping subnet', async () => {
    vi.spyOn(api, 'fetchProjectSubnets').mockResolvedValue(mockSubnets);
    vi.spyOn(api, 'createSubnet').mockRejectedValue(
      new Error('Subnet 192.168.20.32/27 overlaps with existing allocated subnet 192.168.20.0/26.')
    );

    render(<SubnetPlanner projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Corporate Supernet')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Allocate New Subnet/i });
    fireEvent.click(addBtn);

    fireEvent.change(screen.getByLabelText(/Subnet CIDR \*/i), {
      target: { value: '192.168.20.32/27' },
    });
    fireEvent.change(screen.getByLabelText(/Label \/ Name \*/i), {
      target: { value: 'Overlapping Subnet' },
    });

    const submitBtn = screen.getByRole('button', { name: /^Allocate Subnet$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/overlaps with existing allocated subnet/i)).toBeInTheDocument();
    });
  });
});
