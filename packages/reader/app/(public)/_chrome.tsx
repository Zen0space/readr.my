'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReaderNav } from '@/components/chrome/ReaderNav';
import { Icon, type IconName } from '@/components/ui';

/**
 * Client-only chrome switch for `(public)` routes.
 *
 * `/login` and `/register` get a split-pane auth surface capped at
 * `max-w-canvas` so it doesn't sprawl on ultrawide screens:
 * - left brand panel with aurora background, product tagline, a
 *   featured "now reading" preview card, and a stats row
 * - right form panel hosting the centered card, with a soft aurora
 *   glow behind it for visual integration
 *
 * Every other public route (`/`, `/terms`, `/privacy`, `/policy`,
 * `/cookies`) gets the sticky top `ReaderNav` — which reads auth
 * state from the `SessionProvider` mounted by the parent server
 * layout.
 */
export const PublicChrome = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isRegister = pathname === '/register';

  if (isAuthPage) {
    return (
      <main className="aurora-bg relative min-h-screen w-full overflow-hidden">
        {/* Soft drifting orbs (purely decorative). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-secondary/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="aurora-grid pointer-events-none absolute inset-0"
        />

        {/* Tiny floating accents (purely decorative). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[18%] left-[8%] h-2 w-2 rounded-full bg-primary/40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[34%] left-[18%] h-3 w-3 rotate-45 border border-secondary/30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[62%] left-[12%] h-1.5 w-1.5 rounded-full bg-tertiary/50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[28%] right-[14%] h-1.5 w-1.5 rounded-full bg-secondary/40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[78%] right-[8%] h-2.5 w-2.5 rotate-45 border border-primary/30"
        />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-canvas flex-col lg:grid lg:grid-cols-2 lg:items-center">
          {/* Brand panel — visible on lg+, hidden on small screens.
              Vertical rhythm is explicit (not justify-between) so the
              gaps stay controlled regardless of viewport height. */}
          <aside className="relative hidden flex-col p-8 xl:p-12 lg:flex">
            <nav
              aria-label="Breadcrumb"
            >
              <ol className="flex items-center gap-0.5 text-xs">
                <li>
                  <Link
                    href="/"
                    className="rounded-md px-2 py-1 text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden="true" className="text-foreground/30">
                  <Icon name="arrow-right" size={12} />
                </li>
                <li>
                  <span
                    aria-current="page"
                    className="rounded-md px-2 py-1 font-semibold text-foreground"
                  >
                    {isRegister ? 'Create Account' : 'Sign In'}
                  </span>
                </li>
              </ol>
            </nav>

            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2"
              aria-label="Auror — go home"
            >
              <AurorLogo />
              <span className="font-display text-xl font-bold tracking-tight text-primary">
                Auror
              </span>
            </Link>

            <div className="mt-12 max-w-md space-y-5 xl:mt-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {isRegister ? 'Start your journey' : 'Read. Write. Earn.'}
              </p>
              <h2 className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-foreground xl:text-5xl">
                Stories that travel with{' '}
                <span className="bg-gradient-to-br from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                  the night.
                </span>
              </h2>
              <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                Auror keeps your library, your wallet, and your latest
                chapter in one calm, beautiful place — wherever you left
                off, on any device.
              </p>
            </div>

            <div className="mt-10 max-w-md xl:mt-12">
              <FeaturedStoryCard />
            </div>

            <ul className="grid grid-cols-3 gap-4 pt-10 text-xs text-muted-foreground">
              <StatItem icon="users" value="12k+" label="active readers" />
              <StatItem icon="book-open" value="340" label="published works" />
              <StatItem icon="zap" value="99.9%" label="uptime" />
            </ul>
          </aside>

          {/* Form panel — the centered card mounts here. */}
          <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 sm:p-10">
            {/* Soft glow behind the card so it sits *in* the aurora,
                not on top of it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/3 left-2/3 h-72 w-72 rounded-full bg-secondary/15 blur-3xl"
            />

            <div className="relative z-10 w-full max-w-sm lg:hidden">
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2"
                aria-label="Auror — go home"
              >
                <AurorLogo />
                <span className="font-display text-xl font-bold tracking-tight text-primary">
                  Auror
                </span>
              </Link>
            </div>

            <div className="relative z-10 flex w-full max-w-md flex-col items-center rise-in">
              {children}
              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
                Your library. Your pace.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ReaderNav />
      <main className="flex-1">{children}</main>
    </div>
  );
};

/**
 * Brand mark used in the brand panel, the mobile header, and the
 * sticky navbar. Kept in lockstep with `ReaderNav` so the logo
 * reads as one mark across the whole product.
 */
const AurorLogo = (): React.ReactElement => (
  <span
    aria-hidden="true"
    className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-on-primary shadow-card"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
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
);

/**
 * One stat row in the bottom of the brand panel.
 * Tiny icon chip above the value gives the row more presence than
 * the bare-numbers version and breaks up the long left column.
 */
const StatItem = ({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}): React.ReactElement => (
  <li className="space-y-2">
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
      <Icon name={icon} size={14} strokeWidth={2.25} />
    </span>
    <p className="font-display text-xl font-semibold tabular-nums text-foreground">
      {value}
    </p>
    <p className="leading-tight">{label}</p>
  </li>
);

/**
 * Mock "now reading" preview card. Demonstrates the kind of state the
 * product tracks — book cover, current chapter, and reading progress —
 * so the brand panel feels like a product, not a marketing splash.
 * Purely decorative; no real data and no links out.
 */
const FeaturedStoryCard = (): React.ReactElement => (
  <div className="relative">
    <div
      aria-hidden="true"
      className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/30 via-secondary/20 to-tertiary/25 opacity-60 blur-2xl"
    />
    <div className="gradient-ring relative rounded-2xl">
      <div className="surface-elevated relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <BookCover />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px animate-pulse-glow rounded-full bg-primary align-middle" />
              Now reading
            </p>
            <h3 className="truncate font-display text-sm font-semibold text-on-surface">
              The Cartographer's Atlas
            </h3>
            <p className="truncate text-[11px] text-on-surface-variant">
              by Mira Solano
            </p>
            <p className="mt-1 text-[11px] font-medium text-on-surface-variant">
              Chapter 12 of 28 · <span className="text-primary">In progress</span>
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full w-[43%] rounded-full bg-gradient-to-r from-primary to-secondary" />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-primary">
                43%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Pure-CSS / SVG book cover. A small abstract motif over a brand
 * gradient — no external image, no asset pipeline.
 */
const BookCover = (): React.ReactElement => (
  <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
    <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-tertiary" />
    <svg
      viewBox="0 0 80 112"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-white/30"
    >
      <circle cx="40" cy="40" r="18" fill="currentColor" opacity="0.25" />
      <path
        d="M14 78 Q40 60 66 78"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M14 88 Q40 70 66 88"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
    <div className="absolute inset-y-0 left-0 w-1 bg-black/15" />
  </div>
);
