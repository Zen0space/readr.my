'use client';

import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { NavItem, NavSection } from './types';

type Props = {
  sections: NavSection[];
  pathname: string;
  onItemClick?: (item: NavItem) => void;
};

const isItemActive = (item: NavItem, pathname: string): boolean =>
  item.match ? item.match(pathname) : pathname.startsWith(item.href);

/**
 * Single nav row inside a group.
 *
 * Design language:
 *   - Flat row inside the surrounding container, no per-row background.
 *   - Idle: muted icon + label, transparent background.
 *   - Hover: soft primary-tinted background wash, icon lifts to primary.
 *   - Active: solid primary pill background, white icon + bold label.
 */
const NavRow = ({
  item,
  active,
  onItemClick,
}: {
  item: NavItem
  active: boolean
  onItemClick?: (item: NavItem) => void
}): React.ReactElement => {
  const className = cn(
    'group/row flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out',
    active
      ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
      : 'text-on-surface-variant hover:bg-primary/[0.08] hover:text-on-surface active:scale-[0.98]',
  )

  const iconClass = cn(
    'h-[18px] w-[18px] shrink-0 transition-all duration-200',
    active
      ? 'text-on-primary'
      : 'text-primary/60 group-hover/row:text-primary',
  )

  const content = (
    <>
      <Icon name={item.icon} size={18} className={iconClass} />
      <span className="truncate leading-none">{item.label}</span>
      {active ? (
        <span
          aria-hidden="true"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-on-primary/60"
        />
      ) : null}
    </>
  )

  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={() => {
          void item.onClick?.()
        }}
        className={className}
      >
        {content}
      </button>
    )
  }
  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  )
}

/**
 * Section header — icon + uppercase label. Acts as a visual anchor for
 * the rows below it. Sits above the items, never inside.
 */
const SectionHeader = ({
  heading,
  icon,
}: {
  heading: string
  icon?: IconName
}): React.ReactElement => (
  <div className="mb-1 flex items-center gap-2 px-1.5">
    {icon ? (
      <span className="inline-flex h-4 w-4 items-center justify-center text-primary/70">
        <Icon name={icon} size={12} />
      </span>
    ) : null}
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/70">
      {heading}
    </p>
  </div>
)

/**
 * Hairline divider rendered between sections to anchor the eye.
 * The first section doesn't need one (the brand divider above already
 * separates it from the header).
 */
const SectionDivider = (): React.ReactElement => (
  <div
    aria-hidden="true"
    className="my-3 h-px bg-gradient-to-r from-transparent via-outline-variant/40 to-transparent"
  />
)

/**
 * Renders one section's items as a flat list (no per-group card).
 * The outer container in <SidebarNav> provides the shared surface
 * fill so all sections read as one continuous panel.
 */
const NavGroup = ({
  items,
  pathname,
  onItemClick,
}: {
  items: NavItem[]
  pathname: string
  onItemClick?: (item: NavItem) => void
}): React.ReactElement => (
  <ul className="space-y-0.5">
    {items.map((item) => (
      <li key={item.label}>
        <NavRow
          item={item}
          active={isItemActive(item, pathname)}
          onItemClick={onItemClick}
        />
      </li>
    ))}
  </ul>
)

export const SidebarNav = ({ sections, pathname, onItemClick }: Props): React.ReactElement => {
  return (
    <nav
      aria-label="Primary sections"
      className="flex-1 overflow-y-auto pt-1 scrollbar-thin scrollbar-thumb-outline-variant/20"
    >
      <ul className="space-y-4">
        {sections.map((section, idx) => (
          <li key={section.heading ?? `section-${idx}`}>
            {idx > 0 ? <SectionDivider /> : null}
            {section.heading ? (
              <SectionHeader heading={section.heading} icon={section.headingIcon} />
            ) : null}
            <NavGroup
              items={section.items}
              pathname={pathname}
              onItemClick={onItemClick}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}