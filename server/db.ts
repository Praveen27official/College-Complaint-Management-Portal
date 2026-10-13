import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Complaint, CreateComplaintInput, UpdateComplaintInput, ComplaintStats, DatabaseStatus } from '../src/types';

// Pre-seeded initial realistic complaints for immediate testing and demonstration
let memoryComplaints: Complaint[] = [
  {
    id: 'c-101',
    referenceId: 'CMP-2026-8942',
    studentName: 'Aarav Sharma',
    category: 'Hostel',
    description: 'High-speed Wi-Fi router on Block B 3rd Floor is frequently dropping connection since Tuesday.',
    location: 'Hostel Block B, Room 314 corridor',
    priority: 'High',
    status: 'In Progress',
    adminRemark: 'Network engineering team has been assigned. Replacement router requested from IT inventory.',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    paymentStatus: 'Paid',
    paymentAmount: 50,
    paymentId: 'pay_N0x8472948271',
    paymentMethod: 'Razorpay UPI (Test)',
    paidAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: 'c-102',
    referenceId: 'CMP-2026-3180',
    studentName: 'Priya Patel',
    category: 'Mess',
    description: 'Mess dining hall drinking water dispenser filter needs urgent replacement, low water pressure.',
    location: 'Central Dining Hall 1',
    priority: 'Urgent',
    status: 'Resolved',
    adminRemark: 'Water purifier maintenance vendor replaced RO cartridge and UV lamp today morning at 10 AM.',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    paymentStatus: 'Paid',
    paymentAmount: 50,
    paymentId: 'pay_N0x3918274011',
    paymentMethod: 'Razorpay Card (Test)',
    paidAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
  {
    id: 'c-103',
    referenceId: 'CMP-2026-5521',
    studentName: '',
    category: 'Infrastructure',
    description: 'Ceiling projector in CS Seminar Hall 2 display colors flickering during lectures.',
    location: 'CS Department, Seminar Hall 2',
    priority: 'Medium',
    status: 'Pending',
    adminRemark: '',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    paymentStatus: 'Paid',
    paymentAmount: 50,
    paymentId: 'pay_N0x5519283746',
    paymentMethod: 'Razorpay Instant (Free Test)',
    paidAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'c-104',
    referenceId: 'CMP-2026-9043',
    studentName: 'Rahul Verma',
    category: 'Academics',
    description: 'Requesting additional copy of modern compiler design reference textbooks in central library.',
    location: 'Central Library, Reference Section 2F',
    priority: 'Low',
    status: 'Pending',
    adminRemark: '',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    paymentStatus: 'Paid',
    paymentAmount: 50,
    paymentId: 'pay_N0x9043819284',
    paymentMethod: 'Razorpay NetBanking (Test)',
    paidAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  }
];

export const SUPABASE_SQL_SCHEMA = `-- Supabase SQL Schema for College Complaint Management System
-- Run this in your Supabase Project -> SQL Editor

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

-- Enable Row Level Security
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow public read & write operations for anonymous student submissions
CREATE POLICY "Allow public insert" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON complaints FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON complaints FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON complaints FOR DELETE USING (true);
`;

let supabaseClient: SupabaseClient | null = null;
let isSupabaseConfigured = false;

export function initSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      isSupabaseConfigured = true;
      console.log('✅ Supabase client initialized with provided URL:', supabaseUrl);
    } catch (err) {
      console.error('❌ Failed to initialize Supabase client:', err);
      supabaseClient = null;
      isSupabaseConfigured = false;
    }
  } else {
    supabaseClient = null;
    isSupabaseConfigured = false;
  }
  return supabaseClient;
}

export function getDatabaseStatus(): DatabaseStatus {
  if (isSupabaseConfigured && supabaseClient) {
    return {
      provider: 'supabase',
      connected: true,
      message: `Connected to Supabase (${process.env.SUPABASE_URL})`,
    };
  }
  return {
    provider: 'local_fallback',
    connected: true,
    message: 'Running in rapid preview / local fallback mode. Add SUPABASE_URL & SUPABASE_ANON_KEY in .env to connect to cloud database.',
  };
}

// Generate unique, readable reference IDs like CMP-2026-7492
export function generateReferenceId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${year}-${randomNum}`;
}

// Transform database row (snake_case) to Complaint object (camelCase)
function mapDbRowToComplaint(row: any): Complaint {
  return {
    id: row.id || row.reference_id,
    referenceId: row.reference_id || row.referenceId,
    studentName: row.student_name ?? row.studentName ?? '',
    category: row.category,
    description: row.description,
    location: row.location ?? '',
    priority: row.priority || 'Medium',
    status: row.status || 'Pending',
    adminRemark: row.admin_remark ?? row.adminRemark ?? '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    resolvedAt: row.resolved_at || row.resolvedAt || undefined,
    paymentStatus: row.payment_status || row.paymentStatus || 'Paid',
    paymentAmount: row.payment_amount ?? row.paymentAmount ?? 50,
    paymentId: row.payment_id || row.paymentId || undefined,
    paymentMethod: row.payment_method || row.paymentMethod || undefined,
    paidAt: row.paid_at || row.paidAt || undefined,
  };
}

// Map Complaint object to DB row format
function mapComplaintToDbRow(complaint: Partial<Complaint>) {
  return {
    reference_id: complaint.referenceId,
    student_name: complaint.studentName || null,
    category: complaint.category,
    description: complaint.description,
    location: complaint.location || null,
    priority: complaint.priority || 'Medium',
    status: complaint.status || 'Pending',
    admin_remark: complaint.adminRemark || null,
    created_at: complaint.createdAt,
    updated_at: complaint.updatedAt,
    resolved_at: complaint.resolvedAt || null,
    payment_status: complaint.paymentStatus || 'Paid',
    payment_amount: complaint.paymentAmount ?? 50,
    payment_id: complaint.paymentId || null,
    payment_method: complaint.paymentMethod || null,
    paid_at: complaint.paidAt || null,
  };
}

export async function createComplaint(input: CreateComplaintInput): Promise<Complaint> {
  const referenceId = generateReferenceId();
  const now = new Date().toISOString();
  const paymentId = input.paymentId || ('pay_' + Math.random().toString(36).substring(2, 12).toUpperCase());
  const newComplaint: Complaint = {
    id: 'c-' + Math.random().toString(36).substring(2, 9),
    referenceId,
    studentName: input.studentName?.trim() || '',
    category: input.category,
    description: input.description.trim(),
    location: input.location?.trim() || '',
    priority: input.priority || 'Medium',
    status: 'Pending',
    adminRemark: '',
    createdAt: now,
    updatedAt: now,
    paymentStatus: input.paymentStatus || 'Paid',
    paymentAmount: input.paymentAmount ?? 50,
    paymentId,
    paymentMethod: input.paymentMethod || 'Razorpay Free Sandbox',
    paidAt: input.paidAt || now,
  };

  const client = initSupabase();
  if (client) {
    try {
      const dbRow = mapComplaintToDbRow(newComplaint);
      const { data, error } = await client
        .from('complaints')
        .insert([dbRow])
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Supabase insert error (falling back to memory):', error.message);
        memoryComplaints.unshift(newComplaint);
        return newComplaint;
      }

      if (data) {
        return mapDbRowToComplaint(data);
      }
    } catch (err) {
      console.warn('⚠️ Exception during Supabase insert:', err);
    }
  }

  // Fallback / memory persistence
  memoryComplaints.unshift(newComplaint);
  return newComplaint;
}

export async function getComplaintByReferenceId(referenceId: string): Promise<Complaint | null> {
  const cleanRef = referenceId.trim().toUpperCase();

  const client = initSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('complaints')
        .select('*')
        .ilike('reference_id', cleanRef)
        .maybeSingle();

      if (!error && data) {
        return mapDbRowToComplaint(data);
      }
    } catch (err) {
      console.warn('⚠️ Supabase query error for referenceId:', err);
    }
  }

  const found = memoryComplaints.find(
    (c) => c.referenceId.toUpperCase() === cleanRef || c.id === referenceId
  );
  return found || null;
}

export async function getAllComplaints(filters?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<Complaint[]> {
  const client = initSupabase();
  let complaints: Complaint[] = [];

  if (client) {
    try {
      let query = client.from('complaints').select('*').order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        complaints = data.map(mapDbRowToComplaint);
      } else if (error) {
        console.warn('⚠️ Supabase getAllComplaints error:', error.message);
        complaints = [...memoryComplaints];
      } else {
        complaints = data ? data.map(mapDbRowToComplaint) : [...memoryComplaints];
      }
    } catch (err) {
      console.warn('⚠️ Exception reading from Supabase, using memory:', err);
      complaints = [...memoryComplaints];
    }
  } else {
    complaints = [...memoryComplaints];
  }

  // Client-side / fallback filtering
  if (filters?.category && filters.category !== 'All') {
    complaints = complaints.filter((c) => c.category === filters.category);
  }
  if (filters?.status && filters.status !== 'All') {
    complaints = complaints.filter((c) => c.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    complaints = complaints.filter(
      (c) =>
        c.referenceId.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.studentName?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return complaints;
}

export async function updateComplaintStatus(
  idOrRef: string,
  update: UpdateComplaintInput
): Promise<Complaint | null> {
  const now = new Date().toISOString();
  const resolvedAt = update.status === 'Resolved' ? now : undefined;

  const client = initSupabase();
  if (client) {
    try {
      const updateData: any = {
        status: update.status,
        admin_remark: update.adminRemark || '',
        updated_at: now,
      };
      if (update.status === 'Resolved') {
        updateData.resolved_at = now;
      }

      const { data, error } = await client
        .from('complaints')
        .update(updateData)
        .or(`id.eq.${idOrRef},reference_id.eq.${idOrRef}`)
        .select()
        .maybeSingle();

      if (!error && data) {
        const updated = mapDbRowToComplaint(data);
        // Also update memory copy
        const idx = memoryComplaints.findIndex(
          (c) => c.id === idOrRef || c.referenceId === idOrRef
        );
        if (idx >= 0) {
          memoryComplaints[idx] = updated;
        }
        return updated;
      }
    } catch (err) {
      console.warn('⚠️ Supabase update error:', err);
    }
  }

  const idx = memoryComplaints.findIndex(
    (c) => c.id === idOrRef || c.referenceId.toUpperCase() === idOrRef.toUpperCase()
  );
  if (idx >= 0) {
    const prev = memoryComplaints[idx];
    const updated: Complaint = {
      ...prev,
      status: update.status,
      adminRemark: update.adminRemark ?? prev.adminRemark,
      updatedAt: now,
      resolvedAt: update.status === 'Resolved' ? (prev.resolvedAt || now) : undefined,
    };
    memoryComplaints[idx] = updated;
    return updated;
  }

  return null;
}

export async function deleteComplaint(idOrRef: string): Promise<boolean> {
  const client = initSupabase();
  if (client) {
    try {
      const { error } = await client
        .from('complaints')
        .delete()
        .or(`id.eq.${idOrRef},reference_id.eq.${idOrRef}`);
      if (!error) {
        memoryComplaints = memoryComplaints.filter(
          (c) => c.id !== idOrRef && c.referenceId !== idOrRef
        );
        return true;
      }
    } catch (err) {
      console.warn('⚠️ Supabase delete error:', err);
    }
  }

  const initialLength = memoryComplaints.length;
  memoryComplaints = memoryComplaints.filter(
    (c) => c.id !== idOrRef && c.referenceId.toUpperCase() !== idOrRef.toUpperCase()
  );
  return memoryComplaints.length < initialLength;
}

export async function getStats(): Promise<ComplaintStats> {
  const complaints = await getAllComplaints();
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;

  const byCategory: Record<any, number> = {
    Hostel: 0,
    Mess: 0,
    Infrastructure: 0,
    Academics: 0,
    Library: 0,
    Transport: 0,
    Other: 0,
  };

  complaints.forEach((c) => {
    if (byCategory[c.category] !== undefined) {
      byCategory[c.category]++;
    } else {
      byCategory['Other']++;
    }
  });

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return {
    total,
    pending,
    inProgress,
    resolved,
    byCategory,
    resolutionRate,
  };
}
