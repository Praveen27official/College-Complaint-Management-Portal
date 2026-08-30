import { Complaint, CreateComplaintInput, UpdateComplaintInput, ComplaintStats, DatabaseStatus } from '../types';

const STORAGE_KEY = 'campuscare_complaints_v1';

const INITIAL_COMPLAINTS: Complaint[] = [
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
  },
];

export function getLocalComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
      return INITIAL_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
    return INITIAL_COMPLAINTS;
  } catch {
    return INITIAL_COMPLAINTS;
  }
}

export function saveLocalComplaints(complaints: Complaint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function localSubmitComplaint(input: CreateComplaintInput): Complaint {
  const complaints = getLocalComplaints();
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const referenceId = `CMP-${year}-${randomNum}`;
  const now = new Date().toISOString();

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
  };

  complaints.unshift(newComplaint);
  saveLocalComplaints(complaints);
  return newComplaint;
}

export function localTrackComplaint(referenceId: string): Complaint | null {
  const complaints = getLocalComplaints();
  const cleanRef = referenceId.trim().toUpperCase();
  return (
    complaints.find(
      (c) => c.referenceId.toUpperCase() === cleanRef || c.id === referenceId
    ) || null
  );
}

export function localVerifyAdmin(password: string): boolean {
  const trimmed = password.trim();
  return (
    trimmed === 'Praveen@admin' ||
    trimmed === 'admin123' ||
    trimmed === 'admin'
  );
}

export function localGetFilteredComplaints(filters?: {
  category?: string;
  status?: string;
  search?: string;
}): Complaint[] {
  let complaints = getLocalComplaints();

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

  return complaints.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function localUpdateComplaint(
  id: string,
  update: UpdateComplaintInput
): Complaint | null {
  const complaints = getLocalComplaints();
  const idx = complaints.findIndex((c) => c.id === id || c.referenceId === id);
  if (idx < 0) return null;

  const prev = complaints[idx];
  const now = new Date().toISOString();
  const updated: Complaint = {
    ...prev,
    status: update.status || prev.status,
    adminRemark: update.adminRemark !== undefined ? update.adminRemark : prev.adminRemark,
    updatedAt: now,
    resolvedAt: update.status === 'Resolved' ? (prev.resolvedAt || now) : undefined,
  };

  complaints[idx] = updated;
  saveLocalComplaints(complaints);
  return updated;
}

export function localDeleteComplaint(id: string): boolean {
  const complaints = getLocalComplaints();
  const filtered = complaints.filter((c) => c.id !== id && c.referenceId !== id);
  if (filtered.length !== complaints.length) {
    saveLocalComplaints(filtered);
    return true;
  }
  return false;
}

export function localGetStats(): ComplaintStats {
  const complaints = getLocalComplaints();
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
