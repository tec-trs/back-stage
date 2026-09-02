import type { ReactNode } from 'react';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

// Shaped like a printed port label, not a chat-app pill: a flat tag with a
// solid color bar down the left edge instead of a fully-tinted background.
const TONE_CLASSES: Record<BadgeTone, string> = {
  default: 'border-line bg-surface text-slate-300 border-l-slate-500',
  success: 'border-line bg-surface text-emerald-300 border-l-emerald-500',
  warning: 'border-line bg-surface text-signal border-l-signal',
  danger: 'border-line bg-surface text-[#e0684f] border-l-impact-source',
};

export function Badge({ children, tone = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-l-2 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
