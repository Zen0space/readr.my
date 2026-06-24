import type { IconName } from '@/components/ui';

/** Roles that can be assigned to a user in the database. */
export type Role = 'reader' | 'author' | 'admin';

/** A single nav entry shown in the sidebar. */
export type NavItem = {
  /** Where the link goes. */
  href: string;
  /** Human-readable label. */
  label: string;
  /** Icon shown to the left of the label. */
  icon: IconName;
  /**
   * Optional custom match for the active state. Defaults to
   * `pathname.startsWith(href)` if omitted. Use `p === '/something'`
   * for exact matches (e.g. dashboard root).
   */
  match?: (path: string) => boolean;
  /**
   * Optional click handler that runs *before* the link navigates.
   * Useful for "Sign out" which needs to clear client state first.
   */
  onClick?: () => void | Promise<void>;
};

/** A logical grouping of nav items, with an optional heading + icon. */
export type NavSection = {
  /** Optional section label rendered above the items. */
  heading?: string;
  /** Icon shown to the left of the heading. Optional. */
  headingIcon?: IconName;
  items: NavItem[];
};

/** Props shared by every Sidebar sub-component. */
export type SidebarContext = {
  role: Role;
  username: string;
  avatarUrl: string | null;
  coinBalance: number | null;
  pathname: string;
};

/** Props for the top-level <Sidebar /> component. */
export type SidebarProps = Omit<SidebarContext, 'pathname'>;
