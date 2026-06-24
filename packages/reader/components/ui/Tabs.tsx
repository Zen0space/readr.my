'use client';

import { type ReactNode } from 'react';
import { atom, useAtom, type PrimitiveAtom } from 'jotai';
import { cn } from '@/lib/cn';

type TabsProps = {
  id: string;
  defaultValue: string;
  items: { value: string; label: string }[];
  children: (active: string) => ReactNode;
};

const tabAtoms = new Map<string, PrimitiveAtom<string>>();

const tabAtom = (id: string, initial: string): PrimitiveAtom<string> => {
  const existing = tabAtoms.get(id);
  if (existing) return existing;
  const created = atom<string>(initial);
  tabAtoms.set(id, created);
  return created;
};

export const Tabs = ({ id, defaultValue, items, children }: TabsProps): React.ReactElement => {
  const a = tabAtom(id, defaultValue);
  const [active, setActive] = useAtom(a);

  return (
    <div>
      <div role="tablist" className="flex gap-1 rounded-2xl bg-surface-container p-1">
        {items.map((item) => {
          const selected = item.value === active;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(item.value)}
              className={cn(
                'flex-1 rounded-xl px-4 py-2 text-sm font-display font-semibold transition-all duration-200',
                selected
                  ? 'bg-surface-container-lowest text-primary shadow-card'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">{children(active)}</div>
    </div>
  );
};
