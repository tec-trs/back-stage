import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  error?: string | null;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  isPending = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} isOpen={isOpen} onClose={onCancel}>
      <p className="mb-4 text-sm text-slate-400">{message}</p>
      {error && (
        <p className="mb-4 rounded border border-l-2 border-l-impact-source border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Aguarde...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
