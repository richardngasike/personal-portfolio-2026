'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="confirm" onClose={onCancel} aria-labelledby="confirm-title">
      <h2 id="confirm-title" className="confirm__title">
        {title}
      </h2>
      <p className="confirm__message">{message}</p>
      <div className="confirm__actions">
        <button type="button" className="abtn abtn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="abtn abtn--danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
