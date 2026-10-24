import { SubnetCalculateRequest, SubnetCalculateResponse } from '../types/calculator';

const API_BASE = '/api';

export async function calculateSubnet(payload: SubnetCalculateRequest): Promise<SubnetCalculateResponse> {
  const response = await fetch(`${API_BASE}/subnets/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Server error: ${response.statusText} (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}
