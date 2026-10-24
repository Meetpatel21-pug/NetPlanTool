export interface SubnetCalculateRequest {
  cidr?: string;
  ip?: string;
  prefix?: number;
  netmask?: string;
}

export interface SubnetCalculateResponse {
  cidr: string;
  ip: string;
  prefix: number;
  netmask: string;
  wildcard_mask: string;
  network_address: string;
  broadcast_address: string | null;
  total_addresses: number;
  usable_addresses: number;
  usable_range_start: string | null;
  usable_range_end: string | null;
  usable_range: string;
  network_bits: number;
  host_bits: number;
  binary_netmask: string;
  binary_network: string;
  special_notes: string;
  is_private: boolean;
}
