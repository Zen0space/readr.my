import type { NavItem, NavSection } from './types';

/**
 * Reader-facing nav. Items are split into three logical sections so
 * the sidebar reads as three purpose-driven groups instead of one flat
 * list:
 *
 *   Home        — primary entry points (Dashboard, Browse)
 *   My Library  — your saved stories
 *   Account     — wallet & subscription
 *
 * Author and admin items live in their own appended sections ("Author
 * Hub", "Admin Command") so they sit visually below the reader
 * concerns they augment.
 */
const READER_HOME_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'layout', match: (p) => p === '/dashboard' },
  { href: '/browse', label: 'Browse', icon: 'compass', match: (p) => p.startsWith('/browse') },
]

const READER_LIBRARY_ITEMS: NavItem[] = [
  { href: '/library', label: 'Library', icon: 'book-open' },
  { href: '/watchlist', label: 'Watchlist', icon: 'star' },
]

const READER_ACCOUNT_ITEMS: NavItem[] = [
  { href: '/wallet', label: 'Wallet', icon: 'credit-card' },
  { href: '/subscription', label: 'Subscription', icon: 'award' },
]

/** Author hub — shown in addition to the reader items when role allows. */
const AUTHOR_ITEMS: NavItem[] = [
  { href: '/author/studio', label: 'Writing Studio', icon: 'edit' },
  { href: '/author/analytics', label: 'Analytics', icon: 'bar-chart' },
  { href: '/author/earnings', label: 'Earnings & Payout', icon: 'dollar-sign' },
]

/** Admin command — shown in addition to author + reader items. */
const ADMIN_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'shield' },
  { href: '/admin/moderation', label: 'Moderation', icon: 'briefcase' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
]

/** Footer — no items needed; settings + sign out live in the settings page. */
export const FOOTER_ITEMS: NavItem[] = [];

/**
 * Build the full nav list for a given role, with purpose-driven
 * headings on every section (including the un-headed top one).
 */
export const buildNavSections = (
  role: 'reader' | 'author' | 'admin',
): { main: NavSection[]; footer: NavItem[] } => {
  const main: NavSection[] = [
    { heading: 'Home', headingIcon: 'home', items: READER_HOME_ITEMS },
    { heading: 'My Library', headingIcon: 'book-open', items: READER_LIBRARY_ITEMS },
    { heading: 'Account', headingIcon: 'user', items: READER_ACCOUNT_ITEMS },
  ]
  if (role === 'author' || role === 'admin') {
    main.push({ heading: 'Author Hub', headingIcon: 'edit', items: AUTHOR_ITEMS })
  }
  if (role === 'admin') {
    main.push({ heading: 'Admin Command', headingIcon: 'shield', items: ADMIN_ITEMS })
  }
  return { main, footer: FOOTER_ITEMS }
}