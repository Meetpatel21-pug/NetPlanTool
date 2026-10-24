export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  subnet_count: number;
  device_count: number;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string;
  owner_id?: string;
}

export interface ProjectUpdatePayload {
  name?: string;
  description?: string;
}
