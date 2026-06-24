import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import { libraryApiClient, meApiClient, walletApiClient, writingsApiClient } from '@/lib/api/serverClient';
import { Card, ErrorBanner, Icon, type IconName } from '@/components/ui';
import { parseFetchError } from '@/lib/errors';
import type { LibraryItem, Writing } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Dashboard · Auror',
  description: 'Your reading home — continue a story, browse new releases, and manage your wallet.',
};

const fetchDashboardData = async (): Promise<{
  library: LibraryItem[];
  stories: Writing[];
  coinBalance: number | null;
  username: string;
  avatarUrl: string | null;
  /** Backend fetch failures, normalized so the page can surface them. */
  backendError: ReturnType<typeof parseFetchError>;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      library: [],
      stories: [],
      coinBalance: null,
      username: '',
      avatarUrl: null,
      backendError: null,
    };
  }

  // Extract the Supabase access_token (used only to talk to the backend
  // as Bearer auth). No direct DB queries here — every profile / wallet /
  // library / stories fetch goes through the Fastify backend.
  let accessToken: string | null = null
  try {
    const supabase = await createServerComponentClient()
    const { data: { session } } = await supabase.auth.getSession()
    accessToken = session?.access_token ?? null
  } catch {
    accessToken = null
  }

  if (!accessToken) {
    return {
      library: [],
      stories: [],
      coinBalance: null,
      username: '',
      avatarUrl: null,
      backendError: null,
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  // One backend round-trip for the profile, one for the wallet, and the
  // library + stories grid in parallel. If any 5xx / network failure hits,
  // report it once via the existing ErrorBanner so the user sees a single
  // clear failure instead of two.
  let backendError: ReturnType<typeof parseFetchError> = null
  let library: LibraryItem[] = []
  let stories: Writing[] = []
  let coinBalance: number | null = null
  let username = ''
  let avatarUrl: string | null = null

  try {
    const [me, libraryRes, storiesRes] = await Promise.all([
      meApiClient.get(baseUrl, { accessToken }),
      libraryApiClient.list(baseUrl, { accessToken }),
      writingsApiClient.list(baseUrl, { limit: 4 }, { accessToken }),
    ])
    username = me.display_name ?? me.email?.split('@')[0] ?? ''
    avatarUrl = me.avatar_url ?? null
    library = libraryRes.items
    stories = storiesRes.items

    // Wallet fetch is best-effort — if it 401s the sidebar already has
    // a fallback, so the dashboard still renders.
    try {
      const wallet = await walletApiClient.get(baseUrl, { accessToken })
      coinBalance = wallet.coin_balance
    } catch {
      coinBalance = null
    }
  } catch (err) {
    backendError = parseFetchError(err)
  }

  return { library, stories, coinBalance, username, avatarUrl, backendError };
};

type Palette = {
  bg: string;
  iconBg: string;
  iconText: string;
  ring: string;
  bar: string;
};

const PALETTES: Record<string, Palette> = {
  violet: {
    bg: 'from-violet-500 to-indigo-600',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    iconText: 'text-violet-600 dark:text-violet-300',
    ring: 'ring-violet-200 dark:ring-violet-900/60',
    bar: 'from-violet-500 to-indigo-500',
  },
  amber: {
    bg: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-600 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-900/60',
    bar: 'from-amber-400 to-orange-500',
  },
  emerald: {
    bg: 'from-emerald-400 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-900/60',
    bar: 'from-emerald-400 to-teal-500',
  },
  rose: {
    bg: 'from-rose-400 to-pink-600',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    iconText: 'text-rose-600 dark:text-rose-300',
    ring: 'ring-rose-200 dark:ring-rose-900/60',
    bar: 'from-rose-400 to-pink-500',
  },
  sky: {
    bg: 'from-sky-400 to-blue-600',
    iconBg: 'bg-sky-100 dark:bg-sky-950/60',
    iconText: 'text-sky-600 dark:text-sky-300',
    ring: 'ring-sky-200 dark:ring-sky-900/60',
    bar: 'from-sky-400 to-blue-500',
  },
};

const SectionHeader = ({
  overline,
  title,
  subtitle,
  action,
}: {
  overline?: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}): React.ReactElement => (
  <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {overline ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          {overline}
        </p>
      ) : null}
      <h2 className="font-display text-2xl font-bold text-on-surface md:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-sm text-on-surface-variant">{subtitle}</p>
      ) : null}
    </div>
    {action ? (
      <Link
        href={action.href}
        className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
      >
        {action.label}
        <Icon
          name="arrow-right"
          size={14}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    ) : null}
  </div>
);

const StatTile = ({
  icon,
  label,
  value,
  hint,
  palette,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  hint?: string;
  palette: Palette;
}): React.ReactElement => (
  <Card className="group relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-card-elevated">
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40 ${palette.bg}`}
    />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="mt-1.5 font-display text-3xl font-bold leading-none tracking-tight text-on-surface">
          {value}
        </p>
        {hint ? (
          <p className="mt-2 text-xs text-on-surface-variant">{hint}</p>
        ) : null}
      </div>
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${palette.iconBg} ${palette.iconText} ${palette.ring}`}
      >
        <Icon name={icon} size={20} />
      </span>
    </div>
    <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
      <div
        className={`h-full w-2/3 rounded-full bg-gradient-to-r ${palette.bar}`}
      />
    </div>
  </Card>
);

const QuickAction = ({
  href,
  label,
  description,
  icon,
  palette,
}: {
  href: string;
  label: string;
  description: string;
  icon: IconName;
  palette: Palette;
}): React.ReactElement => (
  <Link href={href} className="group block h-full">
    <Card className="relative h-full overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-card-elevated">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-opacity group-hover:opacity-25 ${palette.bg}`}
      />
      <div className="relative">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 transition-transform group-hover:scale-110 ${palette.bg}`}
        >
          <Icon name={icon} size={22} />
        </span>
        <h3 className="mt-5 font-display text-base font-bold text-on-surface transition-colors group-hover:text-on-surface">
          {label}
        </h3>
        <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
      </div>
    </Card>
  </Link>
);

const RecentLibraryRow = ({ item }: { item: LibraryItem }): React.ReactElement => (
  <Link href={`/read/${item.story_id}`} className="group block">
    <Card className="flex items-center gap-4 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-elevated">
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-container-high shadow-sm">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400">
            <Icon name="book" size={18} className="text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-display text-sm font-bold text-on-surface transition-colors group-hover:text-primary">
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">
          {item.author_pen_name ?? 'Author'}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Ready to continue
          </span>
        </div>
      </div>
      <Icon
        name="arrow-right"
        size={16}
        className="shrink-0 text-on-surface-variant transition-all group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </Card>
  </Link>
);

const DiscoverTile = ({ writing }: { writing: Writing }): React.ReactElement => (
  <Link href={`/read/${writing.id}`} className="group block">
    <Card className="h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-card-elevated">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-high">
        {writing.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={writing.cover_url}
            alt={writing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400">
            <Icon name="book-open" size={40} className="text-white" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface shadow-sm backdrop-blur">
            {writing.status === 'ongoing' ? 'Ongoing' : 'Complete'}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-1 font-display text-sm font-bold text-white">
            {writing.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/80">
            {writing.blurb?.trim() || 'No description provided.'}
          </p>
        </div>
      </div>
    </Card>
  </Link>
);

const EmptyLibraryState = (): React.ReactElement => (
  <Card className="group relative overflow-hidden p-0 transition-all hover:shadow-card-elevated">
    <div className="relative flex flex-col items-start gap-6 px-8 py-10 sm:flex-row sm:items-center md:px-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-orange-400/5" />
      <div className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-violet-500/30">
        <Icon name="bookmark" size={28} />
      </div>
      <div className="relative flex-1 space-y-1.5">
        <h3 className="font-display text-xl font-bold text-on-surface">
          Your shelf is empty
        </h3>
        <p className="text-sm leading-relaxed text-on-surface-variant">
          Save a story to come back to — tap the bookmark on anything that catches your eye.
        </p>
      </div>
      <Link
        href="/"
        className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40"
      >
        Browse stories
        <Icon name="arrow-right" size={16} />
      </Link>
    </div>
  </Card>
);

const WelcomeBanner = ({
  firstName,
  initials,
  avatarUrl,
  libraryCount,
}: {
  firstName: string;
  initials: string;
  avatarUrl: string | null;
  libraryCount: number;
}): React.ReactElement => (
  <section
    aria-label="Welcome"
    className="relative overflow-hidden rounded-3xl px-6 py-10 shadow-card md:px-10 md:py-12"
  >
    {/* Bold multi-color gradient — breaks out of the purple-only palette */}
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400"
    />
    {/* Decorative mesh overlays for depth */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-400/40 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/40 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]"
    />

    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/20 text-white shadow-lg ring-2 ring-white/40 backdrop-blur">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={firstName} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-lg font-bold tracking-tight">
            {initials}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-white/30 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Welcome back
        </span>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
          {firstName}.
        </h1>
        <p className="max-w-2xl text-sm text-white/85 md:text-base">
          {libraryCount > 0
            ? `You have ${libraryCount} ${libraryCount === 1 ? 'story' : 'stories'} saved. Pick up where you left off, or discover something new below.`
            : 'Your library is empty for now — browse the catalog and tap the bookmark on anything that catches your eye.'}
        </p>
      </div>
    </div>
  </section>
);

export default async function DashboardPage(): Promise<React.ReactElement> {
  const { library, stories, coinBalance, username, avatarUrl, backendError } =
    await fetchDashboardData();
  const recentLibrary = library.slice(0, 3);
  const discoverStories = stories.slice(0, 4);
  const firstName = username.split(/[\s._-]/)[0] || 'reader';
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-12">
      {/* Backend error banner — only shown when the backend fetch failed */}
      {backendError ? (
        <ErrorBanner error={backendError} retryHref="/dashboard" />
      ) : null}

      {/* Welcome banner — bold gradient hero */}
      <WelcomeBanner
        firstName={firstName}
        initials={initials}
        avatarUrl={avatarUrl}
        libraryCount={library.length}
      />

      {/* Snapshot row — color-coded tiles, one palette per metric */}
      <section aria-label="Snapshot">
        <SectionHeader
          overline="At a glance"
          title="Your reading snapshot"
          subtitle="The numbers behind your shelves."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon="book-open"
            label="In Library"
            value={library.length}
            hint={library.length === 0 ? 'Save a story to begin' : 'Saved to your shelf'}
            palette={PALETTES.violet}
          />
          <StatTile
            icon="credit-card"
            label="Coins"
            value={coinBalance ?? 0}
            hint={coinBalance === 0 ? 'Top up to unlock chapters' : 'Ready to spend'}
            palette={PALETTES.amber}
          />
          <StatTile
            icon="award"
            label="Plan"
            value="Free"
            hint="Upgrade for perks"
            palette={PALETTES.emerald}
          />
          <StatTile
            icon="zap"
            label="Streak"
            value="0d"
            hint="Read today to start"
            palette={PALETTES.rose}
          />
        </div>
      </section>

      {/* Quick actions — each tile gets its own gradient icon */}
      <section aria-labelledby="quick-actions-heading">
        <SectionHeader
          overline="Quick actions"
          title="Jump back in"
          subtitle="Shortcuts to the surfaces you visit most."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/library"
            label="My Library"
            description={`${library.length} saved`}
            icon="book-open"
            palette={PALETTES.violet}
          />
          <QuickAction
            href="/wallet"
            label="Wallet"
            description="Coins & top-ups"
            icon="credit-card"
            palette={PALETTES.amber}
          />
          <QuickAction
            href="/subscription"
            label="Subscription"
            description="Plan & perks"
            icon="award"
            palette={PALETTES.emerald}
          />
          <QuickAction
            href="/"
            label="Browse"
            description="Find new stories"
            icon="compass"
            palette={PALETTES.sky}
          />
        </div>
      </section>

      {/* Library surface — list or empty state */}
      <section aria-labelledby="library-heading">
        <SectionHeader
          overline="Library"
          title="Your shelf"
          subtitle={
            recentLibrary.length > 0
              ? 'Your latest bookmarks, ready when you are.'
              : undefined
          }
          action={
            recentLibrary.length > 0
              ? { href: '/library', label: 'View all' }
              : undefined
          }
        />
        {recentLibrary.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {recentLibrary.map((item) => (
              <RecentLibraryRow key={item.story_id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyLibraryState />
        )}
      </section>

      {/* Discover — gradient fallback covers + dark title overlay */}
      {discoverStories.length > 0 ? (
        <section aria-labelledby="discover-heading">
          <SectionHeader
            overline="From the catalogue"
            title="Discover"
            subtitle="New releases from across Auror."
            action={{ href: '/', label: 'See all' }}
          />
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {discoverStories.map((writing) => (
              <DiscoverTile key={writing.id} writing={writing} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}