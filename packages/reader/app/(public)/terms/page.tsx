import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service · Auror',
  description: 'The terms that govern your use of Auror.',
};

const LAST_UPDATED = '2026-06-23';

export default function TermsPage(): React.ReactElement {
  return (
    <LegalPage
      eyebrow="Legal · Malaysia-first"
      title="Terms of Service"
      summary="Auror is operated from Malaysia. These terms are governed by Malaysian law, with carve-outs so international readers keep the protections their home jurisdiction gives them."
      lastUpdated={LAST_UPDATED}
      icon="shield"
      sections={[
        {
          id: 'accepting-these-terms',
          title: 'Accepting these terms',
          body: (
            <p>
              By creating an Auror account, topping up coins, or browsing
              the catalogue you agree to these Terms of Service. If you do
              not agree, please don't use the service. <strong>This page
              is a TBD placeholder</strong> — the final text will replace
              it once reviewed by counsel.
            </p>
          ),
        },
        {
          id: 'governing-law',
          title: 'Governing law — Malaysia first',
          body: (
            <>
              <p>
                Auror is operated by a Malaysian entity and these terms
                are governed by the laws of Malaysia, including:
              </p>
              <ul>
                <li>
                  <strong>Akta Kontrak 1950</strong> — formation and
                  enforceability of contracts.
                </li>
                <li>
                  <strong>Akta Perlindungan Pengguna 1999 (Act 599)</strong> —
                  misleading conduct, unfair contract terms, and product
                  safety.
                </li>
                <li>
                  <strong>Communications and Multimedia Act 1998 (Act 588)</strong> —
                  content standards enforced by MCMC.
                </li>
                <li>
                  <strong>Akta Hak Cipta 1987</strong> — author rights in
                  published works.
                </li>
              </ul>
              <p>
                Disputes are first mediated through{' '}
                <a href="mailto:legal@auror.my">legal@auror.my</a>; if
                unresolved within 60 days they fall under the exclusive
                jurisdiction of the courts of Malaysia.
              </p>
            </>
          ),
        },
        {
          id: 'international-users',
          title: 'International users',
          body: (
            <>
              <p>
                Nothing in these terms removes any non-excludable rights
                you have under the consumer or data-protection law of
                your country of residence. If Malaysian law offers less
                protection than your local law on a specific point, your
                local law prevails on that point.
              </p>
              <p>
                Auror is offered internationally on an "as available"
                basis. Some features (e.g. specific payment methods,
                author payouts, local content) may not be available in
                every jurisdiction.
              </p>
            </>
          ),
        },
        {
          id: 'your-account',
          title: 'Your account',
          body: (
            <>
              <p>
                You're responsible for activity under your account. Keep
                your password safe and don't share it. Tell us promptly
                if you suspect unauthorised access — we will help you
                recover and lock the account.
              </p>
              <p>
                You must be at least 13 years old, or the minimum
                digital-consent age in your country, whichever is higher,
                to hold an Auror account. Authors who receive payouts
                must additionally satisfy the{' '}
                <strong>Akta Syarikat 2016</strong> onboarding checks
                (SSM registration, bank account in your legal name).
              </p>
            </>
          ),
        },
        {
          id: 'coins-and-payments',
          title: 'Coins, payments and refunds',
          body: (
            <>
              <p>
                Coins are Auror's in-app currency. They unlock gated
                chapters and, where available, author subscriptions.
                Prices are shown in Malaysian Ringgit (MYR) at checkout,
                inclusive of Sales Tax and Service Tax (SST) where
                applicable under the Sales Tax Act 2018 and Service Tax
                Act 2018.
              </p>
              <p>
                <strong>Coin top-ups are final sale.</strong> Because
                coins are digital credits redeemable instantly and cannot
                be returned once spent, Auror does not offer a general
                cooling-off period on top-ups. We do provide:
              </p>
              <ul>
                <li>
                  Clear pre-purchase disclosure of what each coin bundle
                  unlocks.
                </li>
                <li>
                  A 14-day refund window for accidental purchases of
                  unspent coins, opened by emailing{' '}
                  <a href="mailto:billing@auror.my">billing@auror.my</a>
                  {' '}with the transaction ID.
                </li>
                <li>
                  Refunds required by Akta 599 (e.g. services not
                  delivered as described) — request via the same
                  address.
                </li>
              </ul>
              <p>
                If we can't resolve a billing dispute within 30 days you
                can escalate to the{' '}
                <strong>Bahagian Penguatkuasa, Kementerian Perdagangan
                Dalam Negeri dan Kos Sara Hidup (KPDN)</strong>.
              </p>
            </>
          ),
        },
        {
          id: 'acceptable-use',
          title: 'Acceptable use',
          body: (
            <ul>
              <li>Don't scrape, mirror, or bulk-download content.</li>
              <li>Don't bypass paywalls or share accounts to evade them.</li>
              <li>
                Don't harass authors, other readers, or Auror staff in
                comments or messages.
              </li>
              <li>
                Don't use Auror to distribute malware, spam, or unlawful
                material under Malaysian law (Penal Code, CMA 1998 §233
                on offensive content).
              </li>
              <li>
                Don't misrepresent your identity or impersonate a public
                figure.
              </li>
            </ul>
          ),
        },
        {
          id: 'content-and-ip',
          title: 'Content and intellectual property',
          body: (
            <>
              <p>
                Stories on Auror are owned by their authors and protected
                under the <strong>Akta Hak Cipta 1987</strong>. You may
                read, bookmark, and (for paid chapters) keep personal
                copies as part of normal platform use. You may not
                reproduce, redistribute, translate for publication, or
                commercially exploit them without the author's written
                permission.
              </p>
              <p>
                Plagiarism reports are actioned under our Content Policy
                and, where appropriate, escalated to the author for
                civil remedy or to the police for criminal action under
                Akta Hak Cipta 1987.
              </p>
            </>
          ),
        },
        {
          id: 'ai-content-disclosure',
          title: 'AI-assisted content (2026 update)',
          body: (
            <>
              <p>
                As of 2026 Auror requires authors to disclose any
                generative AI involvement in writing, cover art, or
                translation. Disclosure is shown on the story page so
                readers can make informed choices.
              </p>
              <p>
                Auror does not currently accept fully AI-generated works
                without substantial human authorship. This position
                will be reviewed as the Akta Hak Cipta 1987 amendment
                process on AI authorship clarifies.
              </p>
            </>
          ),
        },
        {
          id: 'changes-and-termination',
          title: 'Changes and termination',
          body: (
            <p>
              We may update these terms from time to time. Material
              changes will be announced in-product and via email at
              least 14 days before they take effect. You can close your
              account at any time from your profile settings.
            </p>
          ),
        },
        {
          id: 'contact',
          title: 'Contact',
          body: (
            <>
              <p>
                Questions about these terms? Email{' '}
                <a href="mailto:legal@auror.my">legal@auror.my</a>.
              </p>
              <p>
                If you prefer to write in:{' '}
                <strong>Auror Sdn Bhd</strong>, [registered address], Kuala
                Lumpur, Malaysia. (SSM registration number: TBD pending
                incorporation.)
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
