'use client';

import Link from 'next/link';

/**
 * Top-of-sidebar brand mark. Sleeker than the login card's:
 *   - Smaller monogram (8×8, no chunky 1px shadow)
 *   - Wordmark in a single solid color, no gradient text — the
 *     column already carries the gradient accent bar, so the brand
 *     mark itself stays monochrome and quiet.
 *   - No subtitle line; saves vertical real-estate and lets the
 *     nav breathe.
 */
export const SidebarBrand = (): React.ReactElement => (
  <div className="mb-4">
    <Link
      href="/dashboard"
      className="group flex items-center gap-2.5"
      aria-label="Auror — go to dashboard"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-on-primary transition-transform group-hover:scale-[1.04]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
          <path d="M4 19a2 2 0 0 1 2-2h12" />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-on-surface">
        Auror
      </span>
    </Link>
  </div>
);
