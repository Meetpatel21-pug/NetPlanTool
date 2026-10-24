import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubnetCalculator } from '../src/features/calculator/SubnetCalculator';
import * as api from '../src/api/calculator';

describe('SubnetCalculator Component', () => {
  const mockVectorResponse = {
    cidr: '192.168.20.0/26',
    ip: '192.168.20.0',
    prefix: 26,
    netmask: '255.255.255.192',
    wildcard_mask: '0.0.0.63',
    network_address: '192.168.20.0',
    broadcast_address: '192.168.20.63',
    total_addresses: 64,
    usable_addresses: 62,
    usable_range_start: '192.168.20.1',
    usable_range_end: '192.168.20.62',
    usable_range: '192.168.20.1 - 192.168.20.62',
    network_bits: 26,
    host_bits: 6,
    binary_netmask: '11111111.11111111.11111111.11000000',
    binary_network: '11000000.10101000.00010100.00000000',
    special_notes: 'Conventional IPv4 /26 subnetting: Network and broadcast are reserved.',
    is_private: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the calculator with title and default inputs', async () => {
    vi.spyOn(api, 'calculateSubnet').mockResolvedValue(mockVectorResponse);

    render(<SubnetCalculator />);

    expect(screen.getByText('IPv4 Subnet Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText(/CIDR Block or Host Address/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('192.168.20.0/26')).toBeInTheDocument();
      expect(screen.getByText('255.255.255.192')).toBeInTheDocument();
      expect(screen.getByText('192.168.20.63')).toBeInTheDocument();
      expect(screen.getByText('64')).toBeInTheDocument();
      expect(screen.getByText('62')).toBeInTheDocument();
    });
  });

  it('calculates properly when user changes CIDR input', async () => {
    const customResponse = {
      ...mockVectorResponse,
      cidr: '10.0.0.0/24',
      netmask: '255.255.255.0',
      total_addresses: 256,
      usable_addresses: 254,
      network_address: '10.0.0.0',
      broadcast_address: '10.0.0.255',
      usable_range: '10.0.0.1 - 10.0.0.254',
    };

    const spy = vi.spyOn(api, 'calculateSubnet')
      .mockResolvedValueOnce(mockVectorResponse) // initial mount
      .mockResolvedValueOnce(customResponse);    // subsequent calculation

    render(<SubnetCalculator />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.0/26')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/CIDR Block or Host Address/i);
    fireEvent.change(input, { target: { value: '10.0.0.0/24' } });

    const calcBtn = screen.getByRole('button', { name: /Calculate/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ cidr: '10.0.0.0/24' });
      expect(screen.getByText('10.0.0.0/24')).toBeInTheDocument();
      expect(screen.getByText('255.255.255.0')).toBeInTheDocument();
      expect(screen.getByText('256')).toBeInTheDocument();
      expect(screen.getByText('254')).toBeInTheDocument();
    });
  });

  it('handles /31 RFC 3021 point-to-point without broadcast address', async () => {
    const p2pResponse = {
      ...mockVectorResponse,
      cidr: '10.0.0.0/31',
      total_addresses: 2,
      usable_addresses: 2,
      broadcast_address: null,
      special_notes: '/31 RFC 3021 Point-to-Point convention: Both addresses usable.',
      usable_range: '10.0.0.0 - 10.0.0.1',
    };

    vi.spyOn(api, 'calculateSubnet')
      .mockResolvedValueOnce(mockVectorResponse)
      .mockResolvedValueOnce(p2pResponse);

    render(<SubnetCalculator />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.0/26')).toBeInTheDocument();
    });

    const p2pChip = screen.getByRole('button', { name: /10\.0\.0\.0\/31 \(RFC 3021 P2P\)/i });
    fireEvent.click(p2pChip);

    await waitFor(() => {
      expect(screen.getByText('10.0.0.0/31')).toBeInTheDocument();
      expect(screen.getByText('None (Special Prefix)')).toBeInTheDocument();
      expect(screen.getByText('/31 RFC 3021 Point-to-Point convention: Both addresses usable.')).toBeInTheDocument();
    });
  });

  it('displays clear error notice when backend returns an error message', async () => {
    vi.spyOn(api, 'calculateSubnet')
      .mockResolvedValueOnce(mockVectorResponse)
      .mockRejectedValueOnce(
        new Error("Invalid IPv4 address '256.0.0.1': Octet 1 value (256) is outside the valid range 0-255.")
      );

    render(<SubnetCalculator />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.0/26')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/CIDR Block or Host Address/i);
    fireEvent.change(input, { target: { value: '256.0.0.1/24' } });

    const calcBtn = screen.getByRole('button', { name: /Calculate/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/outside the valid range 0-255/i)).toBeInTheDocument();
    });
  });

  it('switches between CIDR mode and split IP + Prefix mode', async () => {
    vi.spyOn(api, 'calculateSubnet').mockResolvedValue(mockVectorResponse);

    render(<SubnetCalculator />);

    await waitFor(() => {
      expect(screen.getByText('192.168.20.0/26')).toBeInTheDocument();
    });

    const splitBtn = screen.getByRole('button', { name: /IP \+ Prefix Length/i });
    fireEvent.click(splitBtn);

    expect(screen.getByLabelText(/IPv4 Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prefix \(\/\)/i)).toBeInTheDocument();

    const cidrBtn = screen.getByRole('button', { name: /CIDR Notation/i });
    fireEvent.click(cidrBtn);

    expect(screen.getByLabelText(/CIDR Block or Host Address/i)).toBeInTheDocument();
  });
});
