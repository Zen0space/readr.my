import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui';

type Section = {
  /** Anchor id used for the in-page TOC. */
  id: string;
  title: string;
  body: ReactNode;
};

type Props = {
  /** Short uppercase eyebrow shown above the title (e.g. "Legal"). */
  eyebrow: string;
  /** Page title shown as the h1. */
  title: string;
  /** One-sentence summary shown beneath the h1. */
  summary: string;
  /** ISO date (YYYY-MM-DD) used for the "Last updated" line. */
  lastUpdated: string;
  /** Page body sections, rendered in order with an in-page TOC above. */
  sections: Section[];
  /** Optional icon shown above the eyebrow. */
  icon?: IconName;
};

/**
 * Shared shell for `/terms`, `/privacy`, and `/policy`. Renders a narrow,
 * centered prose column inside the marketing `ReaderNav` chrome.
 *
 * Sections get stable anchor ids so a future TOC + anchor links work
 * without restructuring once real copy replaces the stub bodies.
 */
export const LegalPage = ({
  eyebrow,
  title,
  summary,
  lastUpdated,
  sections,
  icon,
}: Props): React.ReactElement => {
  return (
    <div className="mx-auto max-w-canvas px-4 pb-24 pt-10 sm:px-6 md:pt-16 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {icon ? <Icon name={icon} size={16} /> : null}
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-on-surface md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base text-on-surface-variant md:text-lg">
          {summary}
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-outline">
          Last updated: {lastUpdated}
        </p>

        <nav
          aria-label="On this page"
          className="mt-10 rounded-2xl border border-outline-variant/30 bg-surface-container/40 p-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            On this page
          </p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {sections.map((section, idx) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-on-surface transition-colors hover:text-primary"
                >
                  <span className="font-display text-xs font-bold text-primary/60">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-24"
            >
              <h2
                id={`${section.id}-heading`}
                className="font-display text-2xl font-bold text-on-surface"
              >
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-on-surface-variant md:text-base [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-on-surface [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 rounded-xl border border-outline-variant/30 bg-surface-container/40 p-5 text-sm text-on-surface-variant">
          <strong className="text-on-surface">Note:</strong> the copy on
          this page is a placeholder pending legal review. It is published
          so the footer links resolve — please treat it as TBD until a
          final version replaces it.
        </p>
      </div>
    </div>
  );
};
