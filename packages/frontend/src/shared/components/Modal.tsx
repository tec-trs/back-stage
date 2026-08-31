import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ModalSize = 'md' | 'lg';

const SIZE_CLASSES: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
};

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
}

export function Modal({ title, isOpen, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 flex max-h-[90vh] w-full flex-col ${SIZE_CLASSES[size]} rounded-lg border border-slate-700 bg-slate-900 shadow-2xl ring-1 ring-white/10`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 p-6 pb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-200"
          >
            &times;
          </button>
        </div>
        {/* Content scrolls within the dialog once it outgrows the viewport (e.g. a
            server's Discos tab after adding several rows) instead of the whole
            page growing a scrollbar and pushing the header/tabs out of view. */}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
