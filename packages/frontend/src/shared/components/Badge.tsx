import type { ReactNode } from 'react';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  default: 'bg-slate-800 text-slate-300',
  success: 'bg-emerald-900/50 text-emerald-300',
  warning: 'bg-amber-900/50 text-amber-300',
  danger: 'bg-red-900/50 text-red-300',
};

export function Badge({ children, tone = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
