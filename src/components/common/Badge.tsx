import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'slate' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variantStyles = {
    emerald: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
    amber: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
    rose: 'bg-rose-950/40 text-rose-300 border-rose-800/60',
    sky: 'bg-sky-950/40 text-sky-300 border-sky-800/60',
    indigo: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    neutral: 'bg-neutral-800/50 text-neutral-300 border-neutral-700'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
