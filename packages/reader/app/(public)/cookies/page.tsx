import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { CookiePreferencesButton } from '@/components/cookies/CookiePreferencesButton';

export const metadata: Metadata = {
  title: 'Cookie Policy · Auror',
  description:
    'How Auror uses cookies and local storage, and how to manage your preferences.',
};

const LAST_UPDATED = '2026-06-24';

export default function CookiesPage(): React.ReactElement {
  return (
    <LegalPage
      eyebrow="Legal · Malaysia-first"
      title="Cookie Policy"
      summary="Auror uses a small set of cookies and local-storage keys to keep you signed in, remember your reading settings, and understand how the app is used. Here is exactly what we set, why, and how to change your mind."
      lastUpdated={LAST_UPDATED}
      icon="compass"
      sections={[
        {
          id: 'what-are-cookies',
          title: 'What are cookies',
          body: (
            <>
              <p>
                Cookies are small text files your browser stores at our
                request. Local storage is a similar browser feature
                that holds slightly larger values for the same origin.
                Both let a website remember state between page loads or
                visits.
              </p>
              <p>
                Under Malaysia's <strong>Personal Data Protection Act
                2010 (Akta 709)</strong> we treat browser identifiers
                and local-storage keys as personal data where they are
                linkable to you. <strong>This page is a TBD
                placeholder</strong>; the final text will replace it
                once reviewed.
              </p>
            </>
          ),
        },
        {
          id: 'categories',
          title: 'Cookie categories we use',
          body: (
            <>
              <p>
                We split the cookies and storage keys we set into four
                categories:
              </p>
              <ul>
                <li>
                  <strong>Essential</strong> — session, authentication,
                  and security. Required for the site to work and
                  cannot be switched off.
                </li>
                <li>
                  <strong>Preferences</strong> — your reading settings,
                  theme, language, and library view.
                </li>
                <li>
                  <strong>Analytics</strong> — aggregate, de-identified
                  usage data so we know which features are working.
                </li>
                <li>
                  <strong>Marketing</strong> — Auror does not currently
                  run third-party advertising or marketing trackers.
                  This category is reserved for future features and is
                  off by default.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'what-we-set',
          title: 'What we actually set today',
          body: (
            <>
              <p>The cookies and storage keys currently in use:</p>
              <ul>
                <li>
                  <strong>sb-*-auth-token</strong> (Essential) —
                  Supabase session token, scoped to our domain, expires
                  when you sign out or after 7 days of inactivity.
                </li>
                <li>
                  <strong>auror.theme</strong> (Preferences) — your
                  light / dark preference.
                </li>
                <li>
                  <strong>auror.cookie-preferences</strong> (Essential)
                  — a record of the choices you make here so we don't
                  show the banner again.
                </li>
                <li>
                  <strong>auror.analytics-consent</strong> (Analytics)
                  — set only after you opt in.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'manage',
          title: 'Manage your preferences',
          body: (
            <>
              <p>
                You can change your choices at any time. Opening the
                preferences panel will not affect your reading session.
              </p>
              <div className="mt-5">
                <CookiePreferencesButton />
              </div>
            </>
          ),
        },
        {
          id: 'third-party',
          title: 'Third-party cookies',
          body: (
            <p>
              Auror does not embed third-party advertising or marketing
              trackers. Payment is handled by our Malaysian payment
              processor; their cookies are set only on the checkout
              page and governed by their own privacy notice.
            </p>
          ),
        },
        {
          id: 'browser-controls',
          title: 'Browser-level controls',
          body: (
            <p>
              Beyond the in-app preferences above, every modern browser
              lets you block or delete cookies site-by-site. Blocking
              essential cookies will sign you out and may break core
              features.
            </p>
          ),
        },
        {
          id: 'changes',
          title: 'Changes to this policy',
          body: (
            <p>
              Material changes are announced in-product and via email
              at least 14 days before they take effect. The "Last
              updated" date at the top of this page reflects the
              current version.
            </p>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          body: (
            <p>
              Questions about cookies? Email{' '}
              <a href="mailto:privacy@auror.my">privacy@auror.my</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
