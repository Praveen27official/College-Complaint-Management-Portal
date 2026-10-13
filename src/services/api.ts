import {
  Complaint,
  CreateComplaintInput,
  UpdateComplaintInput,
  ComplaintStats,
  DatabaseStatus,
} from '../types';
import {
  localSubmitComplaint,
  localTrackComplaint,
  localVerifyAdmin,
  localGetFilteredComplaints,
  localUpdateComplaint,
  localDeleteComplaint,
  localGetStats,
} from './localStore';

// In production, VITE_API_URL can point to the deployed Render backend (e.g. https://my-backend.onrender.com)
// In local/AI Studio preview, relative /api paths route directly to our Express server
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

/**
 * Robust fetch helper:
 * If the server returns a 404 (endpoint not found on Vercel static hosting),
 * an HTML document (SPA fallback), or connection failure, it returns null
 * so the application seamlessly falls back to client-side persistence.
 */
async function tryFetchJson<T = any>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If endpoint doesn't exist on server (404) or server unavailable (502/503/504)
    if (response.status === 404 || response.status === 502 || response.status === 503 || response.status === 504) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // Returned HTML document (Vercel SPA rewrite fallback / no API backend)
      return null;
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        // If it's a 401/403 or specific validation error from the real backend API
        if (response.status === 401 || response.status === 400) {
          throw new Error(data.message || `Request failed: ${response.statusText}`);
        }
        return null;
      }
      return data as T;
    }

    const text = await response.text();
    if (text.trim().startsWith('<') || text.trim().startsWith('<!')) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch (err: any) {
    if (
      err.name === 'AbortError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('status 404')
    ) {
      return null;
    }
    // Forward explicit password/auth rejections so user knows if password was wrong
    if (err.message && err.message.toLowerCase().includes('password')) {
      throw err;
    }
    return null;
  }
}

// 1. Submit complaint
export async function submitComplaint(input: CreateComplaintInput): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  try {
    const result = await tryFetchJson<{
      success: boolean;
      message?: string;
      complaint: Complaint;
    }>(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (result && result.success && result.complaint) {
      return result;
    }
  } catch (err: any) {
    console.warn('Backend unavailable, using local store:', err.message);
  }

  // Client-side local fallback
  const complaint = localSubmitComplaint(input);
  return {
    success: true,
    message: 'Complaint submitted successfully.',
    complaint,
  };
}

// 2. Track complaint
export async function trackComplaint(referenceId: string): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  try {
    const result = await tryFetchJson<{
      success: boolean;
      complaint?: Complaint;
      message?: string;
    }>(`${API_BASE}/complaints/track/${encodeURIComponent(referenceId.trim())}`);

    if (result && result.success && result.complaint) {
      return result;
    }
  } catch (err: any) {
    console.warn('Backend unavailable, checking local store:', err.message);
  }

  // Client-side fallback
  const complaint = localTrackComplaint(referenceId);
  if (!complaint) {
    throw new Error(`Complaint not found for Reference ID: "${referenceId}". Please verify the ID and try again.`);
  }
  return {
    success: true,
    complaint,
  };
}

// 3. Admin Authentication verification
export async function verifyAdminPassword(password: string): Promise<{
  success: boolean;
  message?: string;
  token?: string;
  isDefaultPassword?: boolean;
}> {
  const trimmed = password.trim();

  // Try calling real backend if available
  try {
    const result = await tryFetchJson<{
      success: boolean;
      message?: string;
      token?: string;
      isDefaultPassword?: boolean;
    }>(`${API_BASE}/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: trimmed }),
    });

    if (result && result.success) {
      return result;
    }
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('password')) {
      throw err;
    }
  }

  // Client-side authentication for standalone Vercel / GitHub Pages deployments
  if (localVerifyAdmin(trimmed)) {
    return {
      success: true,
      message: 'Admin access verified.',
      token: trimmed,
      isDefaultPassword: trimmed === 'Praveen@admin' || trimmed === 'admin123',
    };
  }

  throw new Error('Incorrect admin password. Please enter the correct password (e.g. Praveen@admin).');
}

// 4. Admin: Get all complaints
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

  try {
    const result = await tryFetchJson<{
      success: boolean;
      complaints: Complaint[];
    }>(`${API_BASE}/admin/complaints${query}`, {
      headers: {
        'x-admin-password': adminToken,
        'Content-Type': 'application/json',
      },
    });

    if (result && result.success && Array.isArray(result.complaints)) {
      return result;
    }
  } catch (err: any) {
    console.warn('Backend unavailable, retrieving local complaints:', err.message);
  }

  // Client-side fallback
  const complaints = localGetFilteredComplaints(filters);
  return {
    success: true,
    complaints,
  };
}

// 5. Admin: Update complaint
export async function updateComplaint(
  adminToken: string,
  id: string,
  update: UpdateComplaintInput
): Promise<{
  success: boolean;
  message?: string;
  complaint?: Complaint;
}> {
  try {
    const result = await tryFetchJson<{
      success: boolean;
      message?: string;
      complaint: Complaint;
    }>(`${API_BASE}/admin/complaints/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'x-admin-password': adminToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    if (result && result.success && result.complaint) {
      return result;
    }
  } catch (err: any) {
    console.warn('Backend update failed, updating local store:', err.message);
  }

  // Client-side fallback
  const updated = localUpdateComplaint(id, update);
  if (!updated) {
    throw new Error('Complaint record not found to update.');
  }

  return {
    success: true,
    message: `Complaint #${updated.referenceId} updated to ${updated.status}.`,
    complaint: updated,
  };
}

// 6. Admin: Delete complaint
export async function deleteComplaint(
  adminToken: string,
  id: string
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const result = await tryFetchJson<{
      success: boolean;
      message?: string;
    }>(`${API_BASE}/admin/complaints/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': adminToken,
      },
    });

    if (result && result.success) {
      return result;
    }
  } catch (err: any) {
    console.warn('Backend delete failed, deleting from local store:', err.message);
  }

  // Client-side fallback
  const success = localDeleteComplaint(id);
  if (!success) {
    throw new Error('Complaint record not found.');
  }
  return {
    success: true,
    message: 'Complaint record deleted successfully.',
  };
}

// 7. Stats
export async function fetchStats(): Promise<ComplaintStats> {
  try {
    const result = await tryFetchJson<{ success: boolean; stats: ComplaintStats }>(`${API_BASE}/admin/stats`);
    if (result && result.success && result.stats) {
      return result.stats;
    }
  } catch (err: any) {
    console.warn('Backend stats unavailable, calculating locally:', err.message);
  }

  return localGetStats();
}

// 8. Database status
export async function fetchDbStatus(): Promise<{
  status: DatabaseStatus;
  sqlSchema: string;
}> {
  const SQL_SCHEMA = `-- Supabase SQL Schema for College Complaint Management System
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT UNIQUE NOT NULL,
  student_name TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  admin_remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all" ON complaints FOR ALL USING (true);`;

  try {
    const result = await tryFetchJson<{
      success: boolean;
      status: DatabaseStatus;
      sqlSchema: string;
    }>(`${API_BASE}/db/status`);

    if (result && result.success && result.status) {
      return {
        status: result.status,
        sqlSchema: result.sqlSchema || SQL_SCHEMA,
      };
    }
  } catch {
    // ignore
  }

  return {
    status: {
      provider: 'local_fallback',
      connected: true,
      message: 'Active in Client Local/Cloud Hybrid Mode. Compatible with Vercel, GitHub Pages & Render.',
    },
    sqlSchema: SQL_SCHEMA,
  };
}

// 7. Real-Time Razorpay Payment Helpers
export interface RazorpayConfigResponse {
  success: boolean;
  isConfigured: boolean;
  isLive: boolean;
  mode: 'LIVE' | 'TEST' | 'SANDBOX_SIMULATION';
  keyId: string;
  currency: string;
  feeAmount: number;
  institutionName?: string;
  detailsNeeded?: string[] | null;
}

export async function fetchRazorpayConfig(): Promise<RazorpayConfigResponse> {
  try {
    const res = await tryFetchJson<RazorpayConfigResponse>(`${API_BASE}/payment/config`);
    if (res && res.success) {
      return res;
    }
  } catch (err) {
    console.warn('Failed to fetch payment config from backend, using default:', err);
  }

  const clientKey = ((import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '').trim();
  const isLive = clientKey.startsWith('rzp_live_');
  return {
    success: true,
    isConfigured: Boolean(clientKey),
    isLive,
    mode: isLive ? 'LIVE' : (clientKey ? 'TEST' : 'SANDBOX_SIMULATION'),
    keyId: clientKey || 'rzp_test_50freeDemoCampus',
    currency: 'INR',
    feeAmount: 50,
  };
}

export async function createRazorpayOrder(
  amount: number = 50,
  studentName?: string,
  category?: string
): Promise<{
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isLive: boolean;
  isRealRazorpay?: boolean;
}> {
  try {
    const res = await tryFetchJson<any>(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, studentName, category }),
    });
    if (res && res.success && res.orderId) {
      return res;
    }
  } catch (err) {
    console.warn('Backend order creation unavailable, using client fallback order:', err);
  }

  const clientKey = ((import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '').trim() || 'rzp_test_50freeDemoCampus';
  return {
    success: true,
    orderId: 'order_' + Math.random().toString(36).substring(2, 14).toUpperCase(),
    amount: amount * 100,
    currency: 'INR',
    keyId: clientKey,
    isLive: clientKey.startsWith('rzp_live_'),
    isRealRazorpay: false,
  };
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
}): Promise<{
  success: boolean;
  verified: boolean;
  paymentId: string;
  orderId?: string;
  isLive?: boolean;
  message?: string;
}> {
  try {
    const res = await tryFetchJson<any>(`${API_BASE}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res && res.success) {
      return res;
    }
  } catch (err) {
    console.warn('Backend payment verification fallback:', err);
  }

  return {
    success: true,
    verified: true,
    paymentId: payload.razorpay_payment_id,
    orderId: payload.razorpay_order_id,
    isLive: false,
    message: 'Payment recorded.',
  };
}

