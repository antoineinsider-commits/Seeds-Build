import React from 'react';

// ==========================================
// CARD COMPONENT
// ==========================================
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 transition-shadow ${
      onClick ? 'cursor-pointer hover:shadow-md' : ''
    } ${className}`}
  >
    {children}
  </div>
);

// ==========================================
// BADGE COMPONENT
// ==========================================
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'featured';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    featured: 'bg-purple-100 text-purple-800 border-purple-300 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// ==========================================
// RATING COMPONENT
// ==========================================
export interface RatingProps {
  score: number;
  reviewCount?: number;
}

export const Rating: React.FC<RatingProps> = ({ score, reviewCount }) => (
  <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
    <span>★</span>
    <span>{score.toFixed(1)}</span>
    {reviewCount !== undefined && (
      <span className="text-slate-400">({reviewCount})</span>
    )}
  </div>
);

// ==========================================
// EMPTY STATE COMPONENT
// ==========================================
export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition"
      >
        {actionLabel}
      </button>
    )}
  </div>
);