export type DeviceType = 'router' | 'switch' | 'server' | 'workstation' | 'printer' | 'access_point';

export interface Device {
  id: string;
  project_id: string;
  name: string;
  device_type: DeviceType;
  role: string;
  mac_address: string | null;
  location: string | null;
  notes: string | null;
  diagram_x: number;
  diagram_y: number;
  created_at: string;
  updated_at: string;
  assigned_ips: string[];
}

export interface DeviceCreatePayload {
  name: string;
  device_type: DeviceType;
  role: string;
  mac_address?: string;
  location?: string;
  notes?: string;
  diagram_x?: number;
  diagram_y?: number;
}

export interface DeviceUpdatePayload {
  name?: string;
  device_type?: DeviceType;
  role?: string;
  mac_address?: string;
  location?: string;
  notes?: string;
  diagram_x?: number;
  diagram_y?: number;
}

export type AssignmentType = 'planned static' | 'reserved' | 'DHCP pool' | 'gateway' | 'unassigned';
export type AssignmentStatus = 'active' | 'planned' | 'deprecated' | 'reserved';

export interface IPAssignment {
  id: string;
  project_id: string;
  subnet_id: string | null;
  device_id: string | null;
  ipv4_address: string;
  assignment_type: AssignmentType;
  status: AssignmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Populated fields
  device_name?: string | null;
  device_role?: string | null;
  subnet_label?: string | null;
  subnet_cidr?: string | null;
}

export interface IPAssignmentCreatePayload {
  ipv4_address: string;
  subnet_id?: string | null;
  device_id?: string | null;
  assignment_type: AssignmentType;
  status: AssignmentStatus;
  notes?: string;
}

export interface IPAssignmentUpdatePayload {
  ipv4_address?: string;
  subnet_id?: string | null;
  device_id?: string | null;
  assignment_type?: AssignmentType;
  status?: AssignmentStatus;
  notes?: string;
}
