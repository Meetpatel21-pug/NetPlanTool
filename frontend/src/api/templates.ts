import { StarterTemplate } from '../types/template';
import { Project } from '../types/project';

const API_BASE = '/api';

export async function fetchStarterTemplates(): Promise<StarterTemplate[]> {
  const res = await fetch(`${API_BASE}/templates`);
  if (!res.ok) throw new Error('Failed to load starter templates');
  return res.json();
}

export async function instantiateProjectFromTemplate(
  templateId: string,
  payload?: { name?: string; description?: string }
): Promise<Project> {
  const res = await fetch(`${API_BASE}/templates/${templateId}/instantiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to instantiate template');
  }
  return res.json();
}
