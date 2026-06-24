'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button, Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';

const STORAGE_KEY = 'auror.cookie-preferences';

type CategoryId = 'essential' | 'preferences' | 'analytics' | 'marketing';

type Category = {
  id: CategoryId;
  name: string;
  description: string;
  icon: IconName;
  required?: boolean;
};

const CATEGORIES: Category[] = [
  {
    id: 'essential',
    name: 'Essential',
    description:
      'Required for the site to work — session, authentication, and security. These cannot be switched off.',
    icon: 'shield',
    required: true,
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description:
      "Remember your reading settings, theme, and language so you don't have to set them every visit.",
    icon: 'settings',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description:
      'Help us understand how readers use Auror so we can improve it. De-identified and aggregated.',
    icon: 'bar-chart',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description:
      'Auror does not currently run third-party advertising. Reserved for future use.',
    icon: 'compass',
  },
];

type Preferences = Record<CategoryId, boolean>;

const DEFAULTS: Preferences = {
  essential: true,
  preferences: true,
  analytics: false,
  marketing: false,
};

type Props = {
  /**
   * Render-prop trigger. The parent supplies the visible button (or
   * any clickable element) and the modal injects the click handler
   * via the `open` callback. This keeps the trigger out of the
   * modal's DOM, so we never end up with nested `<button>` elements.
   */
  children: (api: { open: () => void }) => ReactNode;
};

/**
 * Cookie consent modal.
 *
 * - Four categories: Essential (always on), Preferences, Analytics, Marketing.
 * - State is persisted to `localStorage` under `auror.cookie-preferences`.
 * - Closes on backdrop click, Escape key, or any of the action buttons.
 * - Renders nothing on the server — the modal is mounted only after
 *   the user clicks the trigger.
 */
export const CookiePreferencesModal = ({
  children,
}: Props): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);

  // Load any previously saved preferences on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<Preferences>;
      // Essential is always on — never let storage override it.
      setPreferences({ ...DEFAULTS, ...parsed, essential: true });
    } catch {
      // Corrupt storage — fall back to defaults.
    }
  }, []);

  // Escape key closes the modal while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const persist = (next: Preferences): void => {
    setPreferences(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setOpen(false);
  };

  const acceptAll = (): void =>
    persist({
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });

  const rejectAll = (): void =>
    persist({
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });

  return (
    <>
      {children({ open: () => setOpen(true) })}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-card-elevated"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant/30 p-6">
              <div>
                <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <Icon name="compass" size={12} />
                  Privacy
                </p>
                <h2
                  id="cookie-preferences-title"
                  className="font-display text-xl font-bold text-on-surface"
                >
                  Cookie preferences
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Choose which cookies Auror can set. You can change this any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Category list */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <ul className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const checked = preferences[cat.id];
                  return (
                    <li
                      key={cat.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container/30 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                          <Icon name={cat.icon} size={16} />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-sm font-semibold text-on-surface">
                              {cat.name}
                            </h3>
                            {cat.required ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                Always on
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={checked}
                        disabled={cat.required}
                        onChange={(value) =>
                          setPreferences({ ...preferences, [cat.id]: value })
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Action row */}
            <div className="flex flex-col gap-2 border-t border-outline-variant/30 p-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={rejectAll}
                className="text-on-surface-variant"
              >
                Reject all
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => persist(preferences)}
                >
                  Save preferences
                </Button>
                <Button type="button" variant="default" onClick={acceptAll}>
                  Accept all
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

/**
 * Lightweight switch control. Renders a real `<button role="switch">`
 * so it's keyboard-focusable and screen-reader friendly out of the
 * box. Sized to match a standard form control.
 */
const Switch = ({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}): React.ReactElement => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => {
      if (!disabled) onChange(!checked);
    }}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
      checked ? 'bg-primary' : 'bg-outline-variant',
      disabled && 'cursor-not-allowed opacity-60',
    )}
  >
    <span
      className={cn(
        'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0.5',
      )}
    />
  </button>
);
