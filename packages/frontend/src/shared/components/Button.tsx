import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'ghost-danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

// Mechanical, not glassy: a flat fill with a 1px inset highlight standing in
// for a panel bevel, and a press that moves the control down into the page
// instead of floating it up — a toggle switch, not a soap bubble.
const BASE_CLASSES =
  'inline-flex items-center justify-center gap-1.5 rounded font-sans font-semibold ' +
  'transition-[transform,background-color,border-color] duration-100 ease-out [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ' +
  'disabled:pointer-events-none disabled:opacity-40 active:translate-y-px';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-signal text-[#1a1204] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] ' +
    'hover:bg-[#e8a552] active:shadow-none',
  secondary:
    'border border-line bg-surface text-slate-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ' +
    'hover:border-slate-600 hover:bg-surface-raised active:shadow-none',
  danger:
    'bg-impact-source text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] ' +
    'hover:bg-[#d9553c] active:shadow-none',
  ghost:
    'text-slate-300 hover:bg-surface-raised hover:text-slate-100',
  'ghost-danger':
    'text-impact-source hover:bg-[#c8452e]/10 hover:text-[#e0684f]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', className = '', type = 'button', icon, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
