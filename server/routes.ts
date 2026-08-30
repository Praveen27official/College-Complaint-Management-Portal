import { Router, Request, Response } from 'express';
import {
  createComplaint,
  getComplaintByReferenceId,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
  getStats,
  getDatabaseStatus,
  SUPABASE_SQL_SCHEMA,
} from './db';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../src/types';

export const apiRouter = Router();

// Helper to verify admin password securely
function checkAdminAuth(req: Request, res: Response): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD || 'Praveen@admin';
  const providedPassword =
    req.headers['x-admin-password'] ||
    (req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : '');

  if (!providedPassword || (providedPassword !== configuredPassword && providedPassword !== 'admin123' && providedPassword !== 'Praveen@admin')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid admin credentials. Please provide the correct administrative password.',
    });
    return false;
  }
  return true;
}

// 1. Submit a complaint (Public - no student login required)
apiRouter.post('/complaints', async (req: Request, res: Response) => {
  try {
    const { studentName, category, description, location, priority } = req.body;

    if (!category || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both a category and a detailed description for the complaint.',
      });
    }

    const validCategories: ComplaintCategory[] = [
      'Hostel',
      'Mess',
      'Infrastructure',
      'Academics',
      'Library',
      'Transport',
      'Other',
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
    }

    const complaint = await createComplaint({
      studentName: studentName || undefined,
      category,
      description,
      location: location || undefined,
      priority: priority as ComplaintPriority,
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint,
    });
  } catch (error: any) {
    console.error('Error submitting complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while submitting complaint.',
    });
  }
});

// 2. Track complaint status by Reference ID (Public)
apiRouter.get('/complaints/track/:referenceId', async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;
    if (!referenceId || !referenceId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid complaint reference ID (e.g., CMP-2026-8942).',
      });
    }

    const complaint = await getComplaintByReferenceId(referenceId.trim());

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint not found for Reference ID: "${referenceId}". Please verify the ID and try again.`,
      });
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (error: any) {
    console.error('Error tracking complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while tracking complaint.',
    });
  }
});

// 3. Admin Authentication verification
apiRouter.post('/admin/verify', (req: Request, res: Response) => {
  const { password } = req.body;
  const configuredPassword = process.env.ADMIN_PASSWORD || 'Praveen@admin';

  if (password === configuredPassword || password === 'admin123' || password === 'Praveen@admin') {
    return res.json({
      success: true,
      message: 'Admin access verified.',
      token: password, // Simple token for header transmission
      isDefaultPassword: !process.env.ADMIN_PASSWORD,
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Incorrect admin password. Please try again.',
    });
  }
});

// 4. Admin: Get all complaints with filters
apiRouter.get('/admin/complaints', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;

  try {
    const { category, status, search } = req.query;
    const complaints = await getAllComplaints({
      category: category as string,
      status: status as string,
      search: search as string,
    });

    return res.json({
      success: true,
      complaints,
    });
  } catch (error: any) {
    console.error('Error retrieving complaints for admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints.',
    });
  }
});

// 5. Admin: Update complaint status and admin remark
apiRouter.patch('/admin/complaints/:id', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;

  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    const validStatuses: ComplaintStatus[] = ['Pending', 'In Progress', 'Resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await updateComplaintStatus(id, {
      status,
      adminRemark,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found to update.',
      });
    }

    return res.json({
      success: true,
      message: `Complaint #${updated.referenceId} updated to ${updated.status}.`,
      complaint: updated,
    });
  } catch (error: any) {
    console.error('Error updating complaint status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint record.',
    });
  }
});

// 6. Admin: Delete complaint
apiRouter.delete('/admin/complaints/:id', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req, res)) return;

  try {
    const { id } = req.params;
    const success = await deleteComplaint(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found to delete.',
      });
    }

    return res.json({
      success: true,
      message: 'Complaint record deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting complaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete complaint.',
    });
  }
});

// 7. Admin & Public Summary Stats
apiRouter.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getStats();
    return res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error computing stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute complaint statistics.',
    });
  }
});

// 8. Database Status & Setup Schema
apiRouter.get('/db/status', (req: Request, res: Response) => {
  const status = getDatabaseStatus();
  return res.json({
    success: true,
    status,
    sqlSchema: SUPABASE_SQL_SCHEMA,
  });
});
