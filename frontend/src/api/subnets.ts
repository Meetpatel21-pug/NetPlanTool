import { Subnet, SubnetCreatePayload, SubnetUpdatePayload } from '../types/subnet';

const API_BASE = '/api';

export async function fetchProjectSubnets(projectId: string): Promise<Subnet[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/subnets`);
  if (!res.ok) throw new Error('Failed to fetch project subnets');
  return res.json();
}

export async function createSubnet(projectId: string, payload: SubnetCreatePayload): Promise<Subnet> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/subnets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to create subnet allocation');
  }
  return res.json();
}

export async function updateSubnet(projectId: string, subnetId: string, payload: SubnetUpdatePayload): Promise<Subnet> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/subnets/${subnetId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to update subnet allocation');
  }
  return res.json();
}

export async function deleteSubnet(projectId: string, subnetId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/subnets/${subnetId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete subnet allocation');
  }
}
