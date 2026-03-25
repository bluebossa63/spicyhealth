'use client';
import { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function useConfirm() {
  const [state, setState] = useState<{
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'friendly';
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((message: string, confirmLabel?: string, variant?: 'danger' | 'friendly'): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ message, confirmLabel, variant, resolve });
    });
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      confirmLabel={state.confirmLabel}
      variant={state.variant || (state.confirmLabel?.includes('löschen') ? 'danger' : 'friendly')}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;

  return { confirm, dialog };
}
