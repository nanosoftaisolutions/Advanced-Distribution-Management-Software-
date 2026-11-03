import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  kicker?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  trendType = 'neutral',
  icon: Icon,
  kicker,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-lg p-4 transition-all duration-150 hover:border-slate-700/80 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-mono tabular-nums ${
              trendType === 'positive'
                ? 'text-emerald-400'
                : trendType === 'negative'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {(subValue || kicker || actionLabel) && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate">
            {subValue && <span>{subValue}</span>}
            {subValue && kicker && <span className="mx-1 text-slate-600">·</span>}
            {kicker && <span className="text-slate-500">{kicker}</span>}
          </div>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
