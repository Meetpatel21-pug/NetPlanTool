import { Device, DeviceCreatePayload, DeviceUpdatePayload } from '../types/inventory';

const API_BASE = '/api';

export async function fetchProjectDevices(projectId: string): Promise<Device[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/devices`);
  if (!res.ok) throw new Error('Failed to fetch project devices');
  return res.json();
}

export async function createDevice(projectId: string, payload: DeviceCreatePayload): Promise<Device> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to create device');
  }
  return res.json();
}

export async function updateDevice(projectId: string, deviceId: string, payload: DeviceUpdatePayload): Promise<Device> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/devices/${deviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to update device');
  }
  return res.json();
}

export async function deleteDevice(projectId: string, deviceId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/devices/${deviceId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete device');
  }
}
