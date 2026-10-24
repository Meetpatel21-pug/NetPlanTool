export interface DiagramLink {
  id: string;
  project_id: string;
  source_device_id: string;
  target_device_id: string;
  label: string | null;
  speed_note: string | null;
  diagram_metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;

  source_device_name?: string | null;
  target_device_name?: string | null;
}

export interface LinkCreatePayload {
  source_device_id: string;
  target_device_id: string;
  label?: string;
  speed_note?: string;
  diagram_metadata?: Record<string, any>;
}

export interface LinkUpdatePayload {
  label?: string;
  speed_note?: string;
  diagram_metadata?: Record<string, any>;
}

export interface NodePositionPayload {
  device_id: string;
  diagram_x: number;
  diagram_y: number;
}
