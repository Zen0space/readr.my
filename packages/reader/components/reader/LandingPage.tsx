import Link from 'next/link';
import { Badge, Button, Card, Icon, type IconName } from '@/components/ui';
import { LandingFooter } from './LandingFooter';
import type { Writing } from '@auror/shared/api';

type Props = {
  initialWritings: Writing[];
};

const formatGenre = (g: string): string =>
  g
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Public landing view shown at `/` for unauthenticated visitors.
 *
 * Sections (all centered in `max-w-canvas` to match the nav):
 *   1. Hero — two-column on desktop: copy + CTAs on the left, a layered
 *      "story card" visual on the right so the panel doesn't read as
 *      half-empty.
 *   2. Why Auror — three-card value props.
 *   3. Browse by genre — chips derived from the live catalogue, plus a
 *      primary "Browse all stories" CTA.
 *   4. How it works — 3-step horizontal flow (Sign up → Pick a story →
 *      Read free), distinct from the value props above.
 *   5. Featured story — single highlighted writing with cover + blurb +
 *      Read now CTA so the page isn't all marketing copy.
 *   6. Reader note — editorial pull-quote, single voice.
 *   7. Closing CTA — gradient panel with the final "Start reading free".
 *   8. Footer — minimal brand block.
 */
export const LandingPage = ({ initialWritings }: Props): React.ReactElement => {
  const preview = initialWritings.slice(0, 4);
  const heroCover =
    preview.find((w) => Boolean(w.cover_url))?.cover_url ?? null;
  const heroTitle = preview[0]?.title ?? 'The Lantern Keeper';
  const featured = preview[0] ?? null;

  // Derive genre chips from the live catalogue. Caps at 8 so the row
  // doesn't sprawl, and dedupes case-insensitively.
  const genres = Array.from(
    new Map(
      initialWritings
        .map((w) => w.genre)
        .filter(Boolean)
        .map((g) => [g.toLowerCase(), g] as const),
    ).keys(),
  )
    .slice(0, 8)
    .map(formatGenre);

  const genreIcons: Record<string, IconName> = {
    Fantasy: 'book-open',
    Romance: 'star',
    Mystery: 'book',
    Thriller: 'alert-triangle',
    'Sci Fi': 'zap',
    'Science Fiction': 'zap',
    Horror: 'alert-triangle',
    Drama: 'book',
    Adventure: 'compass',
  };

  return (
    <>
    <div className="mx-auto max-w-canvas space-y-20 px-4 pb-24 pt-8 sm:px-6 md:space-y-28 md:pt-14 lg:px-10">
      {/* ============ Hero ============ */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-primary-container/40 via-surface to-secondary-container/30 px-6 py-14 shadow-card md:px-14 md:py-20"
      >
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/0.08),transparent_55%)]" />

        <div className="relative grid items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <div>
            <Badge tone="primary" size="sm" className="mb-5">
              Self-hosted reading platform
            </Badge>
            <h1
              id="hero-heading"
              className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-on-background md:text-6xl"
            >
              Enter the realm of{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                deep flow
              </span>{' '}
              reading.
            </h1>
            <p className="mt-6 max-w-xl text-base text-on-surface-variant md:text-lg">
              Auror is a Malaysia-first home for chapter-by-chapter stories from local authors.
              Read free, support writers you love with coins, and pick up where you left off on
              any device.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" prefetch={false}>
                <Button size="lg" className="w-full sm:w-auto">
                  Get started
                  <Icon name="arrow-right" size={20} />
                </Button>
              </Link>
              <Link href="/login" prefetch={false}>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs font-medium tracking-wide text-on-surface-variant">
              Free to read · No credit card needed
            </p>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-outline-variant/30 pt-6">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  Stories
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold text-on-surface">200+</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  Authors
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold text-on-surface">Local</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  First chapter
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold text-primary">Free</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden h-[420px] md:block" aria-hidden="true">
            <div className="absolute right-4 top-6 h-64 w-44 rotate-[8deg] rounded-2xl border border-outline-variant/40 bg-surface-container shadow-card-elevated">
              <div className="m-3 h-40 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container" />
              <div className="mx-3 mt-3 h-2 rounded-full bg-outline-variant/40" />
              <div className="mx-3 mt-2 h-2 w-3/4 rounded-full bg-outline-variant/30" />
            </div>
            <div className="absolute right-32 top-20 h-64 w-44 -rotate-[6deg] rounded-2xl border border-outline-variant/40 bg-surface-container shadow-card-elevated">
              <div className="m-3 h-40 rounded-xl bg-gradient-to-br from-secondary-container to-tertiary-container" />
              <div className="mx-3 mt-3 h-2 rounded-full bg-outline-variant/40" />
              <div className="mx-3 mt-2 h-2 w-2/3 rounded-full bg-outline-variant/30" />
            </div>
            <div className="absolute right-16 top-32 h-72 w-52 rounded-2xl border border-primary/20 bg-surface shadow-card-elevated">
              {heroCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroCover}
                  alt=""
                  className="h-56 w-full rounded-t-2xl object-cover"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-t-2xl bg-gradient-to-br from-primary via-secondary to-tertiary">
                  <Icon name="book-open" size={48} className="text-on-primary" />
                </div>
              )}
              <div className="p-4">
                <p className="line-clamp-1 font-display text-sm font-bold text-on-surface">
                  {heroTitle}
                </p>
                <p className="mt-0.5 text-[11px] text-on-surface-variant">Local author</p>
              </div>
            </div>
            <div className="absolute right-2 top-72 flex items-center gap-2 rounded-full border border-primary-container/30 bg-surface/90 px-3 py-1.5 shadow-card backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Now reading
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Why Auror ============ */}
      <section aria-labelledby="value-heading" className="relative">
        <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Why Auror
            </p>
            <h2
              id="value-heading"
              className="font-display text-3xl font-bold text-on-surface md:text-4xl"
            >
              How Auror works
            </h2>
          </div>
          <p className="max-w-sm text-sm text-on-surface-variant">
            A small, transparent platform built around writers and readers —
            no growth hacks, no dark patterns.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="group p-7 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-elevated">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container/30 text-primary transition-transform group-hover:scale-110">
              <Icon name="book" size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-on-surface">
              Read free, chapter by chapter
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              The first chapters of every story are free. No paywall on the
              first page, no cliffhanger-to-pay tricks.
            </p>
          </Card>
          <Card className="group p-7 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-elevated">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container/30 text-primary transition-transform group-hover:scale-110">
              <Icon name="circle" size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-on-surface">
              Support writers with coins
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Top up once, unlock chapters across the catalogue. Authors keep
              a clear majority of every ringgit spent on their work.
            </p>
          </Card>
          <Card className="group p-7 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-elevated">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container/30 text-primary transition-transform group-hover:scale-110">
              <Icon name="bookmark" size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-on-surface">
              Your library, anywhere
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Bookmark stories, pick up where you stopped, and sync across
              devices. Your progress follows you.
            </p>
          </Card>
        </div>
      </section>

      {/* ============ Browse by genre ============ */}
      <section
        aria-labelledby="browse-heading"
        className="relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container/40 px-6 py-12 md:px-12 md:py-16"
      >
        <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Browse
            </p>
            <h2
              id="browse-heading"
              className="font-display text-3xl font-bold text-on-surface md:text-4xl"
            >
              Find your next read
            </h2>
            <p className="mt-2 max-w-xl text-sm text-on-surface-variant md:text-base">
              Jump straight into a genre, or wander the full catalogue — new
              chapters drop every week from local writers.
            </p>
            {genres.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {genres.map((g) => (
                  <li key={g}>
                    <Link
                      href={`/?q=${encodeURIComponent(g)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                    >
                      <Icon
                        name={genreIcons[g] ?? 'book'}
                        size={16}
                        className="text-primary"
                      />
                      {g}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Link href="/" prefetch={false}>
              <Button size="lg" className="w-full md:w-auto">
                <Icon name="compass" size={20} />
                Browse all stories
              </Button>
            </Link>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Icon name="award" size={16} />
              See subscription perks
            </Link>
          </div>
        </div>
      </section>

      {/* ============ How it works (3 steps) ============ */}
      <section aria-labelledby="steps-heading">
        <div className="mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Get started
          </p>
          <h2
            id="steps-heading"
            className="font-display text-3xl font-bold text-on-surface md:text-4xl"
          >
            Three steps from sign-up to story
          </h2>
        </div>
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Create your free account',
              body: 'Sign up with email or a social login. No card needed, no trial to remember to cancel.',
              icon: 'user-plus' as const,
            },
            {
              n: '02',
              title: 'Pick a story from the catalogue',
              body: 'Browse by genre, search by title or author, or open whatever catches your eye on the home feed.',
              icon: 'search' as const,
            },
            {
              n: '03',
              title: 'Read the first chapters free',
              body: 'Start reading instantly. Bookmark to come back later — your place syncs to every device you sign in on.',
              icon: 'book' as const,
            },
          ].map((step) => (
            <li
              key={step.n}
              className="relative rounded-2xl border border-outline-variant/30 bg-surface-container/40 p-7"
            >
              <span className="font-display text-5xl font-bold leading-none text-primary/20">
                {step.n}
              </span>
              <div className="mt-3 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container/30 text-primary">
                <Icon name={step.icon} size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex justify-center">
          <Link href="/register" prefetch={false}>
            <Button size="lg">
              Create your free account
              <Icon name="arrow-right" size={20} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ============ Featured story ============ */}
      {featured ? (
        <section
          aria-labelledby="featured-heading"
          className="relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-secondary-container/30 via-surface to-primary-container/30 px-6 py-12 md:px-12 md:py-16"
        >
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative grid items-center gap-10 md:grid-cols-[260px_1fr]">
            <Link
              href={`/read/${featured.id}`}
              className="group mx-auto block w-44 md:mx-0 md:w-60"
              prefetch={false}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface shadow-card-elevated transition-transform duration-500 group-hover:-rotate-1 group-hover:scale-[1.02]">
                {featured.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.cover_url}
                    alt={featured.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-secondary to-tertiary">
                    <Icon name="book-open" size={56} className="text-on-primary" />
                  </div>
                )}
              </div>
            </Link>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                This week's pick
              </p>
              <h2
                id="featured-heading"
                className="font-display text-3xl font-bold text-on-surface md:text-4xl"
              >
                {featured.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base text-on-surface-variant md:text-lg">
                {featured.blurb?.trim() ||
                  'A story from the Auror catalogue — open it to read the first chapter free.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href={`/read/${featured.id}`} prefetch={false}>
                  <Button size="lg">
                    <Icon name="play" size={20} />
                    Read first chapter
                  </Button>
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <Icon name="compass" size={16} />
                  See more like this
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ Editorial pull-quote ============ */}
      <section
        aria-labelledby="quote-heading"
        className="relative mx-auto max-w-3xl text-center"
      >
        <Icon
          name="book-open"
          size={40}
          className="mx-auto text-primary/40"
        />
        <blockquote className="mt-6">
          <p
            id="quote-heading"
            className="font-display text-2xl font-medium leading-snug text-on-surface md:text-3xl"
          >
            “The first chapter rule is what sold me — I get to know the
            voice of the story before I decide whether to follow it.
            That's the deal every reading app should make.”
          </p>
        </blockquote>
        <p className="mt-6 text-sm font-medium text-on-surface-variant">
          A reader note from the Auror editorial team
        </p>
      </section>

      {/* ============ Start reading preview ============ */}
      {preview.length > 0 ? (
        <section aria-labelledby="preview-heading">
          <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                From the catalogue
              </p>
              <h2
                id="preview-heading"
                className="font-display text-3xl font-bold text-on-surface md:text-4xl"
              >
                Start reading
              </h2>
            </div>
            <p className="max-w-sm text-sm text-on-surface-variant">
              A taste of what writers on Auror are publishing right now.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {preview.map((w) => (
              <Link
                key={w.id}
                href={`/read/${w.id}`}
                className="group block"
                prefetch={false}
              >
                <Card className="h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-elevated">
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-high">
                    {w.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.cover_url}
                        alt={w.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-container/40 to-secondary-container/40">
                        <Icon name="book" size={40} className="text-primary" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-display text-sm font-bold text-on-surface group-hover:text-primary">
                      {w.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
                      {w.blurb?.trim() || 'No description provided.'}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ============ Closing CTA ============ */}
      <section
        aria-labelledby="closing-heading"
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-secondary px-6 py-14 text-center text-on-primary shadow-card-elevated md:px-14 md:py-20"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-on-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-on-primary/10 blur-3xl" />
        <div className="relative">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-on-primary/80">
            Ready when you are
          </p>
          <h2
            id="closing-heading"
            className="font-display text-3xl font-bold leading-tight md:text-5xl"
          >
            Start reading free today.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-on-primary/85 md:text-lg">
            No card needed. The first chapter of every story is on us —
            forever.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" prefetch={false}>
              <Button
                size="lg"
                variant="secondary"
                className="w-full bg-on-primary !text-primary hover:bg-on-primary/90 sm:w-auto"
              >
                Get started
                <Icon name="arrow-right" size={20} />
              </Button>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-on-primary/40 px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </div>
    <LandingFooter />
    </>
  );
};
