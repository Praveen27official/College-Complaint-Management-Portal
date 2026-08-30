export type ComplaintCategory = 
  | 'Hostel' 
  | 'Mess' 
  | 'Infrastructure' 
  | 'Academics' 
  | 'Library' 
  | 'Transport' 
  | 'Other';

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Complaint {
  id: string;
  referenceId: string;
  studentName?: string;
  category: ComplaintCategory;
  description: string;
  location?: string;
  priority?: ComplaintPriority;
  status: ComplaintStatus;
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateComplaintInput {
  studentName?: string;
  category: ComplaintCategory;
  description: string;
  location?: string;
  priority?: ComplaintPriority;
}

export interface UpdateComplaintInput {
  status: ComplaintStatus;
  adminRemark?: string;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  byCategory: Record<ComplaintCategory, number>;
  resolutionRate: number;
}

export interface DatabaseStatus {
  provider: 'supabase' | 'local_fallback';
  connected: boolean;
  message: string;
  tableExists?: boolean;
}
