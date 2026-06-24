import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy · Auror',
  description: 'What Auror collects, why, and what we do with it under the PDPA 2010.',
};

const LAST_UPDATED = '2026-06-23';

export default function PrivacyPage(): React.ReactElement {
  return (
    <LegalPage
      eyebrow="Legal · Malaysia-first"
      title="Privacy Policy"
      summary="Auror is a Malaysian-operated service. We process your personal data under the Personal Data Protection Act 2010 (Akta 709) — with extra protections where your local law is stronger."
      lastUpdated={LAST_UPDATED}
      icon="lock"
      sections={[
        {
          id: 'what-this-covers',
          title: 'What this policy covers',
          body: (
            <p>
              This policy explains how Auror Sdn Bhd ("Auror", "we", "us")
              collects, uses, stores, and shares personal data when you
              use the Auror reader app, browse our catalogue, or buy
              coins. <strong>This page is a TBD placeholder</strong>;
              the final text will replace it once reviewed.
            </p>
          ),
        },
        {
          id: 'pdpa-2010',
          title: 'Governing law — PDPA 2010 (Akta 709)',
          body: (
            <>
              <p>
                Auror is registered as a data user with{' '}
                <strong>Jabatan Perlindungan Data Peribadi (JPDP)</strong>
                {' '}— the Department of Personal Data Protection,
                administered under the{' '}
                <strong>Personal Data Protection Act 2010 (Akta 709)</strong>
                {' '}and its 2013 regulations.
              </p>
              <p>
                JPDP is the supervisory authority. You may lodge a
                complaint with JPDP at{' '}
                <a
                  href="https://www.pdp.gov.my"
                  target="_blank"
                  rel="noreferrer"
                >
                  pdp.gov.my
                </a>{' '}
                if you believe we have breached Akta 709.
              </p>
              <p>
                Auror follows the seven Personal Data Protection
                Principles in Akta 709:
              </p>
              <ul>
                <li>
                  <strong>General Principle</strong> — we process your
                  data only with your consent, except where the law
                  permits otherwise.
                </li>
                <li>
                  <strong>Notice and Choice Principle</strong> — we tell
                  you why we need each piece of data before we collect
                  it.
                </li>
                <li>
                  <strong>Disclosure Principle</strong> — we identify
                  the purpose before disclosing to third parties.
                </li>
                <li>
                  <strong>Security Principle</strong> — your data is
                  protected from loss, misuse, and unauthorised access.
                </li>
                <li>
                  <strong>Retention Principle</strong> — we keep data
                  only as long as needed.
                </li>
                <li>
                  <strong>Data Integrity Principle</strong> — your data
                  stays accurate and current.
                </li>
                <li>
                  <strong>Access Principle</strong> — you can request a
                  copy and correct anything wrong.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'international-users',
          title: 'International users — what we add on top',
          body: (
            <>
              <p>
                If you are based outside Malaysia, Akta 709 still
                applies because Auror operates from Malaysia. We commit
                to applying the higher of Malaysian law and the
                non-excludable protections of your home jurisdiction —
                for example:
              </p>
              <ul>
                <li>
                  <strong>EU / EEA / UK</strong> — GDPR-aligned rights
                  (data portability, erasure, restriction) are honoured
                  even though Akta 709 is the governing statute.
                </li>
                <li>
                  <strong>Singapore</strong> — PDPA 2012 protections on
                  consent and correction are honoured where stricter.
                </li>
                <li>
                  <strong>Other regions</strong> — local consumer /
                  privacy regulators' non-excludable rights are
                  preserved.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'what-we-collect',
          title: 'What we collect',
          body: (
            <ul>
              <li>
                <strong>Account data</strong> — email, display name,
                password (hashed), and your assigned role
                (reader / author / admin).
              </li>
              <li>
                <strong>Reading activity</strong> — bookmarks, reading
                progress, library contents, coin balance, and
                subscription status.
              </li>
              <li>
                <strong>Payment data</strong> — handled by our
                Malaysian payment processor under their own PDPA
                registration. Auror never sees your card number.
              </li>
              <li>
                <strong>Diagnostics</strong> — basic device, browser,
                and error metadata so we can keep the app working.
              </li>
            </ul>
          ),
        },
        {
          id: 'why-we-collect-it',
          title: 'Why we collect it',
          body: (
            <p>
              To run the service: sign you in, sync your library across
              devices, process coin purchases, prevent abuse, and improve
              the product. We don't sell personal data, and we don't run
              third-party advertising trackers.
            </p>
          ),
        },
        {
          id: 'where-data-lives',
          title: 'Where your data lives',
          body: (
            <>
              <p>
                Auror is self-hosted in Malaysia. Account and reading
                data live in our Supabase project hosted in the same
                region (AWS ap-southeast-5 / Malaysia region where
                available). Backups stay within-region.
              </p>
              <p>
                Payment processing is routed to our Malaysian payment
                processor; their privacy notice applies to payment
                metadata they handle.
              </p>
            </>
          ),
        },
        {
          id: 'cross-border-transfers',
          title: 'Cross-border transfers',
          body: (
            <p>
              Where sub-processors are located outside Malaysia (for
              example, our email provider or analytics vendor), we only
              transfer personal data under contractual safeguards that
              meet the <strong>Section 129</strong> "comparable to
              PDPA" standard in Akta 709 — namely a binding written
              contract that imposes the same data-protection
              obligations on the recipient.
            </p>
          ),
        },
        {
          id: 'sharing',
          title: 'When we share data',
          body: (
            <ul>
              <li>
                With authors for the sales and engagement numbers on
                their own stories — anonymised in aggregate where
                possible.
              </li>
              <li>
                With our payment processor to handle coin top-ups and
                author payouts.
              </li>
              <li>
                With authorities when legally compelled, narrowly scoped
                to the request, and reviewed by counsel where time
                permits.
              </li>
            </ul>
          ),
        },
        {
          id: 'your-rights',
          title: 'Your rights under PDPA',
          body: (
            <>
              <p>
                Under Akta 709, you can:
              </p>
              <ul>
                <li>
                  Request a copy of your personal data (Access
                  Principle) — usually within 21 days.
                </li>
                <li>
                  Correct inaccurate personal data (Data Integrity
                  Principle) — usually within 21 days.
                </li>
                <li>
                  Withdraw consent, subject to legal or contractual
                  limits (e.g. we may still need to keep tax records for
                  7 years under the Income Tax Act 1967).
                </li>
                <li>
                  Prevent processing that causes unwarranted
                  substantial damage or distress.
                </li>
              </ul>
              <p>
                Exercise these from profile settings, or email{' '}
                <a href="mailto:privacy@auror.my">privacy@auror.my</a>.
                If we cannot resolve your concern you may lodge a
                complaint with JPDP.
              </p>
            </>
          ),
        },
        {
          id: 'cookies',
          title: 'Cookies and local storage',
          body: (
            <p>
              We use strictly necessary cookies for session and
              security, and local storage to remember your reading
              preferences. There are no advertising cookies. Under
              Akta 709 we treat browser identifiers and local-storage
              keys as personal data where they are linkable to you.
            </p>
          ),
        },
        {
          id: 'retention',
          title: 'How long we keep your data',
          body: (
            <p>
              Account data is kept while your account is active. On
              account closure, personal data is removed within 30 days,
              except records we are legally required to retain (tax
              records for 7 years; financial-transaction records under
                  Bank Negara Malaysia guidelines for 6 years).
            </p>
          ),
        },
        {
          id: 'changes',
          title: 'Changes to this policy',
          body: (
            <p>
              We will announce material changes in-product and via email
              at least 14 days before they take effect. Non-material
              updates (typos, contact details) take effect immediately
              with the new "Last updated" date.
            </p>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          body: (
            <p>
              Privacy questions? Email{' '}
              <a href="mailto:privacy@auror.my">privacy@auror.my</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
