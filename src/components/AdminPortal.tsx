import { useState, FC, useEffect, useMemo, FormEvent } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Key, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  Download, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X, 
  Sparkles,
  MessageSquare,
  Building,
  Check,
  ChevronRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintStats } from '../types';
import { 
  verifyAdminPassword, 
  getAdminComplaints, 
  updateComplaint, 
  deleteComplaint, 
  fetchStats 
} from '../services/api';
import { StatusBadge, CategoryBadge, PriorityBadge } from './StatusBadge';

interface AdminPortalProps {
  onAdminAuthChange: (isAuth: boolean) => void;
  onNavigateToGuide: () => void;
}

export const AdminPortal: FC<AdminPortalProps> = ({ onAdminAuthChange, onNavigateToGuide }) => {
  // Authentication state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('campuscare_admin_token') || null;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Data states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for editing/modal
  const [activeModalComplaint, setActiveModalComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Pending');
  const [newRemark, setNewRemark] = useState('');
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Load complaints and stats when authenticated
  useEffect(() => {
    if (adminToken) {
      onAdminAuthChange(true);
      loadDashboardData(adminToken);
    } else {
      onAdminAuthChange(false);
    }
  }, [adminToken]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passwordInput.trim()) {
      setAuthError('Please enter the administrative password.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await verifyAdminPassword(passwordInput);
      if (res.success && res.token) {
        sessionStorage.setItem('campuscare_admin_token', res.token);
        setAdminToken(res.token);
        onAdminAuthChange(true);
        setPasswordInput('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid admin credentials. (Default is admin123)');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('campuscare_admin_token');
    setAdminToken(null);
    onAdminAuthChange(false);
    setComplaints([]);
    setStats(null);
  };

  const loadDashboardData = async (token: string) => {
    setLoading(true);
    try {
      const [complaintsRes, statsData] = await Promise.all([
        getAdminComplaints(token, {
          category: selectedCategory,
          status: selectedStatus,
          search: searchQuery,
        }),
        fetchStats(),
      ]);

      if (complaintsRes.success) {
        setComplaints(complaintsRes.complaints);
      }
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      if (err.message?.includes('Unauthorized')) {
        handleLogout();
        setAuthError('Session expired. Please log in again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (!adminToken) return;
    setRefreshing(true);
    loadDashboardData(adminToken);
  };

  // Open Edit Modal
  const openEditModal = (complaint: Complaint) => {
    setActiveModalComplaint(complaint);
    setNewStatus(complaint.status);
    setNewRemark(complaint.adminRemark || '');
    setModalFeedback(null);
  };

  // Submit Status / Remark Update
  const handleSaveUpdate = async () => {
    if (!adminToken || !activeModalComplaint) return;
    setActionLoading(true);
    setModalFeedback(null);

    try {
      const res = await updateComplaint(adminToken, activeModalComplaint.id, {
        status: newStatus,
        adminRemark: newRemark.trim(),
      });

      if (res.success && res.complaint) {
        // Update list optimistically
        setComplaints((prev) =>
          prev.map((c) => (c.id === res.complaint!.id ? res.complaint! : c))
        );
        // Refresh stats
        const updatedStats = await fetchStats();
        setStats(updatedStats);

        setModalFeedback('Status & remark updated successfully!');
        setTimeout(() => {
          setActiveModalComplaint(null);
          setModalFeedback(null);
        }, 1200);
      }
    } catch (err: any) {
      setModalFeedback(`Error: ${err.message || 'Failed to update'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Complaint
  const handleDelete = async (id: string, refId: string) => {
    if (!adminToken) return;
    if (!confirm(`Are you sure you want to permanently delete complaint #${refId}?`)) {
      return;
    }

    try {
      await deleteComplaint(adminToken, id);
      setComplaints((prev) => prev.filter((c) => c.id !== id));
      const updatedStats = await fetchStats();
      setStats(updatedStats);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Filter complaints in memory if search query or pills change
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.referenceId.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [complaints, selectedCategory, selectedStatus, searchQuery]);

  // Export complaints as CSV
  const handleExportCSV = () => {
    if (filteredComplaints.length === 0) {
      alert('No complaints to export.');
      return;
    }

    const headers = ['Reference ID', 'Date', 'Category', 'Status', 'Priority', 'Student Name', 'Location', 'Description', 'Admin Remark'];
    const rows = filteredComplaints.map((c) => [
      c.referenceId,
      new Date(c.createdAt).toLocaleDateString(),
      c.category,
      c.status,
      c.priority || 'Medium',
      c.studentName || 'Anonymous',
      `"${(c.location || '').replace(/"/g, '""')}"`,
      `"${c.description.replace(/"/g, '""')}"`,
      `"${(c.adminRemark || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unauthenticated Login Prompt
  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto my-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mx-auto mb-4 border border-blue-200">
            <Lock className="w-6 h-6 text-[#1E3A8A]" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              Admin Portal Login
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized university administrative personnel & redressal officers only.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-password-field" className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <input
                  id="admin-password-field"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full pl-3.5 pr-10 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-lg text-sm outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Default Password Hint & Demo Autofill */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />
                  <span>Admin password: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300">Praveen@admin</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordInput('Praveen@admin')}
                  className="text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer uppercase tracking-wider"
                >
                  Autofill
                </button>
              </div>
            </div>

            <button
              id="btn-admin-login"
              type="submit"
              disabled={authLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-lg transition-all shadow-md shadow-blue-950/10 disabled:opacity-60 cursor-pointer"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Admin Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Admin Controls & Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Shield className="w-3 h-3 text-emerald-600" />
              Authenticated Session
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">College Administration Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Complaints Management Console
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-refresh-admin"
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-admin-logout"
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Logged</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">{stats.total}</span>
              <span className="text-xs text-slate-400">All categories</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatus('Pending')}
            className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              selectedStatus === 'Pending' ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-200 hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Pending Action</span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-yellow-900 font-mono">{stats.pending}</span>
              <span className="text-xs font-semibold text-yellow-700">Needs review</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatus('In Progress')}
            className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              selectedStatus === 'In Progress' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">In Progress</span>
              <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-blue-900 font-mono">{stats.inProgress}</span>
              <span className="text-xs font-semibold text-blue-700">Assigned</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedStatus('Resolved')}
            className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
              selectedStatus === 'Resolved' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-emerald-900 font-mono">{stats.resolved}</span>
              <span className="text-xs font-semibold text-emerald-700">{stats.resolutionRate}% Rate</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference ID, keyword, student name, location..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-lg text-xs sm:text-sm outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pill Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto text-xs shrink-0">
            {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map((status) => (
              <button
                key={status}
                id={`filter-status-${status.toLowerCase().replace(' ', '-')}`}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider text-[10px] sm:text-xs transition-all whitespace-nowrap cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-xs border-t border-slate-100">
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {(['All', 'Hostel', 'Mess', 'Infrastructure', 'Academics', 'Library', 'Transport', 'Other'] as const).map((cat) => (
            <button
              key={cat}
              id={`filter-cat-${cat.toLowerCase()}`}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-900 text-white font-bold shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints Table & Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Complaints Queue ({filteredComplaints.length})
            </h3>
            {(selectedCategory !== 'All' || selectedStatus !== 'All' || searchQuery) && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
                Filtered view
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Click any row or Update button to edit status & remarks</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-[#1E3A8A] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium">Loading complaints from database...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No complaints found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No complaint records matched your current category, status, or search filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSearchQuery('');
              }}
              className="mt-3 text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer uppercase tracking-wider"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Ref ID</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Description & Remarks</th>
                  <th className="py-3.5 px-3">Location</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredComplaints.map((c) => (
                  <tr 
                    key={c.id} 
                    id={`complaint-row-${c.referenceId.toLowerCase()}`}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => openEditModal(c)}
                  >
                    {/* Reference ID & Student */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A] whitespace-nowrap">
                      <div>{c.referenceId}</div>
                      <div className="text-[11px] font-sans font-normal text-slate-400 mt-0.5">
                        {c.studentName || 'Anonymous 🔒'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <CategoryBadge category={c.category} />
                    </td>

                    {/* Description & Remark preview */}
                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 font-medium line-clamp-2 max-w-md text-xs sm:text-sm">
                        {c.description}
                      </p>
                      {c.adminRemark && (
                        <div className="flex items-center gap-1 text-[11px] text-[#1E3A8A] mt-1 font-medium bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 w-fit">
                          <MessageSquare className="w-3 h-3 text-blue-600" />
                          <span className="line-clamp-1">Remark: {c.adminRemark}</span>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 text-xs">
                      {c.location || '—'}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 text-xs font-mono">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          id={`btn-edit-${c.referenceId.toLowerCase()}`}
                          onClick={() => openEditModal(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Update</span>
                        </button>

                        <button
                          type="button"
                          id={`btn-delete-${c.referenceId.toLowerCase()}`}
                          onClick={() => handleDelete(c.id, c.referenceId)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete complaint record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status & Add Remark Modal Dialog */}
      {activeModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div 
            id="admin-edit-modal"
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleUp"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Update Redressal Status
                </span>
                <h3 className="text-lg font-bold text-[#1E3A8A] font-mono mt-0.5">
                  #{activeModalComplaint.referenceId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalComplaint(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {modalFeedback && (
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  modalFeedback.includes('Error') 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{modalFeedback}</span>
                </div>
              )}

              {/* Read-only Original Complaint Overview */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <CategoryBadge category={activeModalComplaint.category} />
                  <span className="text-slate-400">
                    Location: <strong>{activeModalComplaint.location || 'Campus'}</strong>
                  </span>
                </div>
                <p className="text-slate-800 text-xs sm:text-sm font-medium pt-1">
                  "{activeModalComplaint.description}"
                </p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Submitted by: <strong>{activeModalComplaint.studentName || 'Anonymous Student'}</strong> • {new Date(activeModalComplaint.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Update Redressal Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Pending', 'In Progress', 'Resolved'] as ComplaintStatus[]).map((st) => {
                    const isSelected = newStatus === st;
                    return (
                      <button
                        key={st}
                        id={`modal-select-status-${st.toLowerCase().replace(' ', '-')}`}
                        type="button"
                        onClick={() => setNewStatus(st)}
                        className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? st === 'Pending'
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-bold ring-2 ring-yellow-200'
                              : st === 'In Progress'
                              ? 'bg-blue-100 border-blue-500 text-blue-800 font-bold ring-2 ring-blue-200'
                              : 'bg-green-100 border-green-500 text-green-800 font-bold ring-2 ring-green-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          {st === 'Pending' && <Clock className="w-4 h-4 text-yellow-700" />}
                          {st === 'In Progress' && <RotateCw className="w-4 h-4 text-blue-700" />}
                          {st === 'Resolved' && <CheckCircle2 className="w-4 h-4 text-green-700" />}
                        </div>
                        <span className="text-xs block uppercase font-bold tracking-wider">{st}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official Admin Remark Textarea */}
              <div>
                <label htmlFor="admin-remark-textarea" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Official Administrative Remark & Action Taken
                </label>
                <textarea
                  id="admin-remark-textarea"
                  rows={3}
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  placeholder="e.g. 'Electrician visited hostel room. Replacement fuse installed and verified.' or 'Mess supervisor notified for kitchen audit.'"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs sm:text-sm outline-none transition-all placeholder:text-slate-400 bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Students will see this note when tracking their reference ID.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveModalComplaint(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="btn-save-complaint-update"
                type="button"
                onClick={handleSaveUpdate}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg shadow-md shadow-blue-950/10 transition-all disabled:opacity-60 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

