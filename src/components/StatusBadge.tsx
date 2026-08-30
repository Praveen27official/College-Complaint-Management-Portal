import { FC } from 'react';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';
import { 
  Clock, 
  RotateCw, 
  CheckCircle2, 
  Home, 
  UtensilsCrossed, 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Bus, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true 
}) => {
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
    md: 'px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider',
    lg: 'px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider',
  }[size];

  // Geometric Balance Theme Status Colors
  switch (status) {
    case 'Pending':
      return (
        <span 
          id={`status-badge-pending-${Math.random().toString(36).substr(2, 4)}`}
          className={`inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200/80 shadow-2xs ${sizeClasses}`}
        >
          {showIcon && <Clock className={`${iconSizes} text-yellow-700`} />}
          <span>Pending</span>
        </span>
      );
    case 'In Progress':
      return (
        <span 
          id={`status-badge-inprogress-${Math.random().toString(36).substr(2, 4)}`}
          className={`inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200/80 shadow-2xs ${sizeClasses}`}
        >
          {showIcon && <RotateCw className={`${iconSizes} text-blue-700 animate-spin-slow`} />}
          <span>In Progress</span>
        </span>
      );
    case 'Resolved':
      return (
        <span 
          id={`status-badge-resolved-${Math.random().toString(36).substr(2, 4)}`}
          className={`inline-flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full border border-green-200/80 shadow-2xs ${sizeClasses}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSizes} text-green-700`} />}
          <span>Resolved</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

export const CategoryBadge: FC<{ category: ComplaintCategory; className?: string }> = ({ 
  category, 
  className = '' 
}) => {
  const getCategoryConfig = () => {
    switch (category) {
      case 'Hostel':
        return {
          icon: <Home className="w-3.5 h-3.5 text-blue-800" />,
          bg: 'bg-blue-50 text-blue-900 border-blue-200',
        };
      case 'Mess':
        return {
          icon: <UtensilsCrossed className="w-3.5 h-3.5 text-orange-700" />,
          bg: 'bg-orange-50 text-orange-900 border-orange-200',
        };
      case 'Infrastructure':
        return {
          icon: <Building2 className="w-3.5 h-3.5 text-slate-700" />,
          bg: 'bg-slate-100 text-slate-900 border-slate-300',
        };
      case 'Academics':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />,
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
        };
      case 'Library':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-teal-700" />,
          bg: 'bg-teal-50 text-teal-900 border-teal-200',
        };
      case 'Transport':
        return {
          icon: <Bus className="w-3.5 h-3.5 text-purple-700" />,
          bg: 'bg-purple-50 text-purple-900 border-purple-200',
        };
      case 'Other':
      default:
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-gray-700" />,
          bg: 'bg-gray-100 text-gray-900 border-gray-300',
        };
    }
  };

  const config = getCategoryConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${config.bg} ${className}`}
    >
      {config.icon}
      <span>{category}</span>
    </span>
  );
};

export const PriorityBadge: FC<{ priority?: ComplaintPriority }> = ({ priority = 'Medium' }) => {
  const config = {
    Low: 'bg-slate-100 text-slate-700 border-slate-300',
    Medium: 'bg-blue-50 text-blue-800 border-blue-200',
    High: 'bg-amber-50 text-amber-800 border-amber-300',
    Urgent: 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse',
  }[priority];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${config}`}>
      {priority === 'Urgent' && <AlertCircle className="w-3 h-3 text-rose-600" />}
      {priority}
    </span>
  );
};

