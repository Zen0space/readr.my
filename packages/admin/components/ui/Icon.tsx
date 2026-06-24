import { type SVGProps } from 'react';

export type IconName =
  | 'mail'
  | 'lock'
  | 'person'
  | 'badge'
  | 'login'
  | 'person-add'
  | 'error'
  | 'check-circle'
  | 'logout'
  | 'settings'
  | 'search'
  | 'toll'
  | 'explore'
  | 'auto-stories'
  | 'account-balance-wallet'
  | 'workspace-premium'
  | 'stylus-note'
  | 'insights'
  | 'monetization-on'
  | 'admin-panel-settings'
  | 'gavel'
  | 'manage-accounts'
  | 'menu-book'
  | 'play-arrow'
  | 'pause'
  | 'volume-up'
  | 'star'
  | 'star-filled'
  | 'shopping-cart'
  | 'plus'
  | 'minus'
  | 'arrow-right'
  | 'arrow-left'
  | 'bookmark'
  | 'bookmark-filled'
  | 'bookmark-add'
  | 'edit'
  | 'trending-up'
  | 'history'
  | 'more-horiz'
  | 'download'
  | 'share'
  | 'flag'
  | 'image'
  | 'send'
  | 'check'
  | 'x'
  | 'eye'
  | 'eye-off';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, React.ReactNode> = {
  mail: (
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  person: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  badge: (
    <>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  login: (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />
    </>
  ),
  'person-add': (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </>
  ),
  'check-circle': (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
    </>
  ),
  toll: (
    <>
      <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0Z" />
      <path d="M2 12h20" />
      <path d="M12 2v20" />
    </>
  ),
  explore: (
    <>
      <path d="M3 3h6v6" />
      <path d="M21 21h-6v-6" />
      <path d="m3 3 7 7" />
      <path d="m14 14 7 7" />
    </>
  ),
  'auto-stories': (
    <>
      <path d="M3 17v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
      <path d="M3 7v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
      <path d="M3 12h18" />
    </>
  ),
  'account-balance-wallet': (
    <>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </>
  ),
  'workspace-premium': (
    <>
      <path d="M2 4h20v16H2z" />
      <path d="M12 4v16" />
      <path d="m2 12 20-8" />
      <path d="m2 12 20 8" />
    </>
  ),
  'stylus-note': (
    <>
      <path d="M15.5 3.5 21 9l-9 9-6 1 1-6Z" />
      <path d="M14 5 19 10" />
    </>
  ),
  insights: (
    <>
      <path d="M21 21H3" />
      <path d="M3 21V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13" />
      <path d="M9 21V12" />
      <path d="M15 21V8" />
    </>
  ),
  'monetization-on': (
    <>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  'admin-panel-settings': (
    <>
      <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  gavel: (
    <>
      <path d="m14 13-7.5 7.5L3 17l7.5-7.5" />
      <path d="m17 10 3-3-3-3-3 3" />
      <path d="m11 6 3 3" />
      <path d="M14 13 21 6" />
    </>
  ),
  'manage-accounts': (
    <>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="m17 11 2 2 4-4" />
    </>
  ),
  'menu-book': (
    <>
      <path d="M3 19V6a2 2 0 0 1 2-2h14v15H5a2 2 0 0 0-2 2Z" />
      <path d="M3 19a2 2 0 0 1 2-2h14" />
    </>
  ),
  'play-arrow': (
    <>
      <polygon points="6 4 20 12 6 20 6 4" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </>
  ),
  'volume-up': (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </>
  ),
  star: (
    <>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </>
  ),
  'star-filled': (
    <>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" />
    </>
  ),
  'shopping-cart': (
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>
  ),
  plus: (
    <>
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </>
  ),
  minus: (
    <>
      <line x1="5" x2="19" y1="12" y2="12" />
    </>
  ),
  'arrow-right': (
    <>
      <line x1="5" x2="19" y1="12" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  'arrow-left': (
    <>
      <line x1="19" x2="5" y1="12" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>
  ),
  bookmark: (
    <>
      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </>
  ),
  'bookmark-filled': (
    <>
      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" fill="currentColor" />
    </>
  ),
  'bookmark-add': (
    <>
      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
      <line x1="12" x2="12" y1="7" y2="13" />
      <line x1="9" x2="15" y1="10" y2="10" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </>
  ),
  'trending-up': (
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  'more-horiz': (
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </>
  ),
  image: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </>
  ),
  send: (
    <>
      <line x1="22" x2="11" y1="2" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>
  ),
  check: (
    <>
      <polyline points="20 6 9 17 4 12" />
    </>
  ),
  x: (
    <>
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 7 11 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </>
  ),
};

export const Icon = ({ name, size = 20, ...rest }: IconProps): React.ReactElement => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {paths[name]}
  </svg>
);
