import { IPAssignment, IPAssignmentCreatePayload, IPAssignmentUpdatePayload } from '../types/inventory';

const API_BASE = '/api';

export async function fetchProjectAssignments(projectId: string): Promise<IPAssignment[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/assignments`);
  if (!res.ok) throw new Error('Failed to fetch project IP assignments');
  return res.json();
}

export async function createAssignment(projectId: string, payload: IPAssignmentCreatePayload): Promise<IPAssignment> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to create IP assignment');
  }
  return res.json();
}

export async function updateAssignment(projectId: string, assignmentId: string, payload: IPAssignmentUpdatePayload): Promise<IPAssignment> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/assignments/${assignmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to update IP assignment');
  }
  return res.json();
}

export async function deleteAssignment(projectId: string, assignmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/assignments/${assignmentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete IP assignment');
  }
}
