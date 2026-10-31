import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  /** Main line, e.g. "No photos yet". */
  label: string;
  /** Supporting line explaining what to do next. */
  sublabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Smaller padding and no card chrome, for use inside an existing card or list. */
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  label,
  sublabel,
  actionLabel,
  onAction,
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      compact
        ? 'py-8 px-4'
        : 'py-14 px-6 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
    }`}
  >
    <Icon className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-neutral-300 dark:text-neutral-600 mb-2`} />
    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{label}</h3>
    {sublabel && <p className="text-xs text-neutral-400 mt-1 max-w-sm">{sublabel}</p>}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
