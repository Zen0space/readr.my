'use client';

import { type ReactNode } from 'react';
import { atom, useAtom } from 'jotai';
import { cn } from '@/lib/cn';

const sheetOpenAtom = atom<string | null>(null);

export const useSheet = (id: string) => {
  const [openId, setOpenId] = useAtom(sheetOpenAtom);
  const isOpen = openId === id;
  return {
    isOpen,
    open: () => setOpenId(id),
    close: () => setOpenId(null),
    toggle: () => setOpenId(isOpen ? null : id),
  };
};

type SheetProps = {
  id: string;
  side?: 'right' | 'bottom';
  title: string;
  children: ReactNode;
};

export const Sheet = ({ id, side = 'right', title, children }: SheetProps): React.ReactElement | null => {
  const { isOpen, close } = useSheet(id);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-on-surface/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={close}
    >
      <div
        className={cn(
          'relative ml-auto h-full w-full max-w-md bg-surface shadow-card-elevated',
          side === 'bottom' && 'ml-0 mt-auto h-auto max-h-[80vh] w-full rounded-t-3xl',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-4">
          <h2 className="font-display text-base font-semibold text-on-surface">{title}</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="h-8 w-8 rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};

type SheetTriggerProps = {
  id: string;
  children: (api: { open: () => void }) => ReactNode;
};

export const SheetTrigger = ({ id, children }: SheetTriggerProps): React.ReactElement => {
  const { open } = useSheet(id);
  return <>{children({ open })}</>;
};
