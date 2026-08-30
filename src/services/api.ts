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

export async function submitComplaint(input: CreateComplaintInput): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  const response = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit complaint');
  }
  return data;
}

export async function trackComplaint(referenceId: string): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  const response = await fetch(`${API_BASE}/complaints/track/${encodeURIComponent(referenceId.trim())}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Complaint not found');
  }
  return data;
}

export async function verifyAdminPassword(password: string): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  isDefaultPassword?: boolean;
}> {
  const response = await fetch(`${API_BASE}/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Invalid admin password');
  }
  return data;
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
  const response = await fetch(`${API_BASE}/admin/complaints${query}`, {
    headers: {
      'x-admin-password': adminToken,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch complaints');
  }
  return data;
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
  const response = await fetch(`${API_BASE}/admin/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'x-admin-password': adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update complaint');
  }
  return data;
}

export async function deleteComplaint(
  adminToken: string,
  id: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  const response = await fetch(`${API_BASE}/admin/complaints/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'x-admin-password': adminToken,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete complaint');
  }
  return data;
}

export async function fetchStats(): Promise<ComplaintStats> {
  const response = await fetch(`${API_BASE}/admin/stats`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch stats');
  }
  return data.stats;
}

export async function fetchDbStatus(): Promise<{
  status: DatabaseStatus;
  sqlSchema: string;
}> {
  const response = await fetch(`${API_BASE}/db/status`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch database status');
  }
  return {
    status: data.status,
    sqlSchema: data.sqlSchema,
  };
}
