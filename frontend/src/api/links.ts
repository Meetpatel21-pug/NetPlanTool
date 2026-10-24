import { DiagramLink, LinkCreatePayload, LinkUpdatePayload, NodePositionPayload } from '../types/diagram';

const API_BASE = '/api';

export async function fetchProjectLinks(projectId: string): Promise<DiagramLink[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/links`);
  if (!res.ok) throw new Error('Failed to fetch project diagram links');
  return res.json();
}

export async function createLink(projectId: string, payload: LinkCreatePayload): Promise<DiagramLink> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to create diagram link');
  }
  return res.json();
}

export async function updateLink(projectId: string, linkId: string, payload: LinkUpdatePayload): Promise<DiagramLink> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/links/${linkId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to update diagram link');
  }
  return res.json();
}

export async function deleteLink(projectId: string, linkId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/links/${linkId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete diagram link');
  }
}

export async function saveDiagramLayout(projectId: string, positions: NodePositionPayload[]): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/diagram/layout`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positions }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to save diagram layout');
  }
}
