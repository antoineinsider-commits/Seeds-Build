import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'primary' | 'featured' }> = ({ children, variant = 'primary' }) => {
  const styles = variant === 'featured' ? 'bg-purple-100 text-purple-800' : 'bg-blue-50 text-blue-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
};
