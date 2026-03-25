'use client';
import { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function useConfirm() {
  const [state, setState] = useState<{
    message: string;
    confirmLabel?: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((message: string, confirmLabel?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ message, confirmLabel, resolve });
    });
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      confirmLabel={state.confirmLabel}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;

  return { confirm, dialog };
}
