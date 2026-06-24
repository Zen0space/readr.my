'use client';

import { usePathname } from 'next/navigation';
import { SidebarBrand } from './SidebarBrand';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import { buildNavSections } from './navItems';
import type { SidebarProps } from './types';

/**
 * Primary left-rail navigation for the (protected) shell.
 *
 * Modern, sleek treatment:
 *   - Solid `surface-container-low` fill on a hairline outline — no
 *     glass, no aurora wash behind the column.
 *   - Top gradient bar (1px) keeps the brand mark present without
 *     competing with content.
 *   - Icon-only nav rows that lean on color, not glow, to indicate
 *     the active state.
 *
 * The column is still 280px wide so the rest of the shell
 * (`md:ml-[280px]` in `(protected)/layout.tsx`) keeps its alignment.
 */
export const Sidebar = ({
  role,
  username,
  avatarUrl,
  coinBalance,
}: SidebarProps): React.ReactElement => {
  const pathname = usePathname()

  const { main } = buildNavSections(role)

  return (
    <nav
      aria-label="Primary"
      className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-outline-variant/30 bg-gradient-to-b from-white via-surface-container-lowest to-surface-container-low md:flex"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(70,72,212,0.06),transparent_55%)]"
      />
      <div className="relative flex h-full flex-col px-3.5 pt-5 pb-4">
        <SidebarBrand />
        <div className="mb-3 h-px bg-outline-variant" aria-hidden="true" />
        <SidebarNav sections={main} pathname={pathname} />
        <SidebarFooter
          role={role}
          username={username}
          avatarUrl={avatarUrl}
          coinBalance={coinBalance}
        />
      </div>
    </nav>
  )
}
