import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium ' +
  'transition-all duration-150 ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ' +
  'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-slate-50 to-slate-200 text-slate-900 shadow-sm shadow-black/20 ' +
    'hover:from-white hover:to-slate-100 hover:shadow-md hover:shadow-black/30 hover:-translate-y-px',
  secondary:
    'border border-slate-700 bg-slate-900/60 text-slate-200 ' +
    'hover:border-slate-600 hover:bg-slate-800 hover:-translate-y-px',
  danger:
    'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-950/40 ' +
    'hover:from-red-400 hover:to-red-500 hover:shadow-md hover:shadow-red-950/50 hover:-translate-y-px',
  ghost:
    'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100',
  'ghost-danger':
    'text-red-400 hover:bg-red-950/40 hover:text-red-300',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
