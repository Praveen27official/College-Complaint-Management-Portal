import {
  Complaint,
  CreateComplaintInput,
  UpdateComplaintInput,
  ComplaintStats,
  DatabaseStatus,
} from '../types';

// In production, VITE_API_URL can point to the deployed Render backend (e.g. https://my-backend.onrender.com)
// In local/AI Studio preview, relative /api paths route directly to our Express server
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data as T;
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Server returned an unexpected format. Please ensure backend is running.');
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Unexpected token')) {
      throw err;
    }
    throw new Error(err.message || 'Unable to connect to server. Please try again.');
  }
}

export async function submitComplaint(input: CreateComplaintInput): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  return safeFetchJson(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function trackComplaint(referenceId: string): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  return safeFetchJson(`${API_BASE}/complaints/track/${encodeURIComponent(referenceId.trim())}`);
}

export async function verifyAdminPassword(password: string): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  isDefaultPassword?: boolean;
}> {
  return safeFetchJson(`${API_BASE}/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

export async function getAdminComplaints(
  adminToken: string,
  filters?: { category?: string; status?: string; search?: string }
): Promise<{
  success: boolean;
  complaints: Complaint[];
}> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  return safeFetchJson(`${API_BASE}/admin/complaints${query}`, {
    headers: {
      'x-admin-password': adminToken,
      'Content-Type': 'application/json',
    },
  });
}

export async function updateComplaint(
  adminToken: string,
  id: string,
  update: UpdateComplaintInput
): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  return safeFetchJson(`${API_BASE}/admin/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'x-admin-password': adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });
}

export async function deleteComplaint(
  adminToken: string,
  id: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  return safeFetchJson(`${API_BASE}/admin/complaints/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'x-admin-password': adminToken,
    },
  });
}

export async function fetchStats(): Promise<ComplaintStats> {
  const data = await safeFetchJson<{ success: boolean; stats: ComplaintStats }>(`${API_BASE}/admin/stats`);
  return data.stats;
}

export async function fetchDbStatus(): Promise<{
  status: DatabaseStatus;
  sqlSchema: string;
}> {
  const data = await safeFetchJson<{
    success: boolean;
    status: DatabaseStatus;
    sqlSchema: string;
  }>(`${API_BASE}/db/status`);
  return {
    status: data.status,
    sqlSchema: data.sqlSchema,
  };
}
