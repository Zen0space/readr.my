import type { SVGProps } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart,
  Book,
  BookOpen,
  Bookmark,
  Briefcase,
  Check,
  CheckCircle,
  Compass,
  CreditCard,
  Circle as CircleIcon,
  DollarSign,
  Edit,
  Grid,
  Home,
  Layout,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Play,
  Search,
  Settings,
  Shield,
  Star,
  Triangle,
  User,
  UserPlus,
  Users,
  X,
  Zap,
  type Icon as FeatherIcon,
} from 'react-feather';

/**
 * Icon names are Feather Icons (https://feathericons.com) — MIT licensed.
 *
 * Old reader-internal names mapped to their Feather equivalents:
 *
 *   account-balance-wallet  → credit-card
 *   arrow-right            → arrow-right
 *   auto-stories           → book-open
 *   badge                  → shield
 *   bookmark-add           → bookmark
 *   check                  → check
 *   check-circle           → check-circle
 *   error                  → alert-circle
 *   explore                → compass
 *   lock                   → lock
 *   login                  → log-in
 *   logout                 → log-out
 *   mail                   → mail
 *   menu-book              → book
 *   person                 → user
 *   person-add             → user-plus
 *   play-arrow             → play
 *   search                 → search
 *   settings               → settings
 *   toll                   → circle
 *   workspace-premium      → award
 *   x                      → x
 *
 * `toll` was a coin chip — we use `circle` for the same circular
 * affordance. `bookmark-add` collapses to `bookmark` (Feather doesn't
 * have a plus variant).
 */
export type IconName =
  | 'alert-circle'
  | 'alert-triangle'
  | 'arrow-right'
  | 'award'
  | 'bar-chart'
  | 'book'
  | 'bookmark'
  | 'book-open'
  | 'briefcase'
  | 'check'
  | 'check-circle'
  | 'circle'
  | 'compass'
  | 'credit-card'
  | 'dollar-sign'
  | 'edit'
  | 'grid'
  | 'home'
  | 'layout'
  | 'lock'
  | 'log-in'
  | 'log-out'
  | 'mail'
  | 'play'
  | 'search'
  | 'settings'
  | 'shield'
  | 'star'
  | 'triangle'
  | 'user'
  | 'user-plus'
  | 'users'
  | 'x'
  | 'zap';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const components: Record<IconName, FeatherIcon> = {
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'arrow-right': ArrowRight,
  'award': Award,
  'bar-chart': BarChart,
  'book': Book,
  'book-open': BookOpen,
  'bookmark': Bookmark,
  'briefcase': Briefcase,
  'check': Check,
  'check-circle': CheckCircle,
  'circle': CircleIcon,
  'compass': Compass,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'edit': Edit,
  'grid': Grid,
  'home': Home,
  'layout': Layout,
  'lock': Lock,
  'log-in': LogIn,
  'log-out': LogOut,
  'mail': Mail,
  'play': Play,
  'search': Search,
  'settings': Settings,
  'shield': Shield,
  'star': Star,
  'triangle': Triangle,
  'user': User,
  'user-plus': UserPlus,
  'users': Users,
  'x': X,
  'zap': Zap,
};

export const Icon = ({ name, size = 20, ...rest }: IconProps): React.ReactElement => {
  const Component = components[name];
  return <Component size={size} {...rest} />;
};
