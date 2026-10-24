export interface Subnet {
  id: string;
  project_id: string;
  parent_subnet_id: string | null;
  cidr: string;
  label: string;
  segment: string | null;
  gateway: string | null;
  dhcp_start: string | null;
  dhcp_end: string | null;
  requested_hosts: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Calculated fields
  network_address?: string;
  broadcast_address?: string | null;
  netmask?: string;
  total_addresses: number;
  usable_addresses: number;
  usable_range?: string;
  capacity_warning?: string | null;
}

export interface SubnetCreatePayload {
  cidr: string;
  label: string;
  parent_subnet_id?: string | null;
  segment?: string;
  gateway?: string;
  dhcp_start?: string;
  dhcp_end?: string;
  requested_hosts?: number;
  notes?: string;
}

export interface SubnetUpdatePayload {
  cidr?: string;
  label?: string;
  parent_subnet_id?: string | null;
  segment?: string;
  gateway?: string;
  dhcp_start?: string;
  dhcp_end?: string;
  requested_hosts?: number;
  notes?: string;
}
