import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Content Policy · Auror',
  description: 'What authors can publish on Auror and what we remove.',
};

const LAST_UPDATED = '2026-06-23';

export default function PolicyPage(): React.ReactElement {
  return (
    <LegalPage
      eyebrow="Legal · Malaysia-first"
      title="Content Policy"
      summary="What authors can publish on Auror, the standards every story must meet, and how we moderate content under Malaysian law."
      lastUpdated={LAST_UPDATED}
      icon="alert-triangle"
      sections={[
        {
          id: 'scope',
          title: 'What this policy covers',
          body: (
            <p>
              This policy applies to every story, chapter, comment,
              profile field, cover image, and translation published on
              Auror. It supplements the Akta Komunikasi dan Multimedia
              1998 (Act 588) and the{' '}
              <strong>Malaysian Communications and Multimedia Content
              Code 2022</strong> (the "Content Code"). Where this policy
              is stricter than the Content Code, we apply this policy.
              Where the Content Code is stricter, we apply the Content
              Code. <strong>This page is a TBD placeholder</strong>;
              the final text will replace it once reviewed.
            </p>
          ),
        },
        {
          id: 'what-belongs',
          title: 'What belongs on Auror',
          body: (
            <p>
              Auror is a home for original fiction. We welcome every
              genre, language, and reading level — including mature
              themes — provided the work is original to the author and
              properly labelled under the Content Code's classification
              rules.
            </p>
          ),
        },
        {
          id: 'labelling',
          title: 'Age ratings, labels and trigger warnings',
          body: (
            <>
              <p>
                Authors must set an accurate age rating (
                <em>general</em>, <em>teen</em>, or <em>mature</em>) and
                trigger-warn sensitive content. These map to the Content
                Code classification categories and are surfaced to
                readers both in the catalogue and at chapter open.
              </p>
              <p>
                Mis-labelling is treated as a content violation and may
                result in takedown under the Content Code's complaint
                mechanism.
              </p>
            </>
          ),
        },
        {
          id: 'prohibited',
          title: 'Prohibited content',
          body: (
            <>
              <p>The following are not permitted on Auror:</p>
              <ul>
                <li>
                  Content that sexualises minors, in any form — illegal
                  under the <strong>Children and Young Persons (Employment)
                  Act 1966</strong> and the{' '}
                  <strong>Penal Code §375A–§376</strong>.
                </li>
                <li>
                  Plagiarised or knowingly misrepresented work —
                  actionable under <strong>Akta Hak Cipta 1987</strong>{' '}
                  (Copyright Act 1987).
                </li>
                <li>
                  AI-generated works passed off as fully human-authored
                  without disclosure (see AI section below).
                </li>
                <li>
                  Content that incites real-world violence, hatred
                  against a protected group, or breaches the peace —
                  actionable under the{' '}
                  <strong>Penal Code</strong> and{' '}
                  <strong>CMA 1998 §233</strong> (offensive content).
                </li>
                <li>
                  Spam, undisclosed advertising, or material designed
                  solely to drive readers off-platform in violation of
                  the Content Code on commercial content.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'ai',
          title: 'AI-assisted content (2026 update)',
          body: (
            <>
              <p>
                Authors may use generative AI tools as drafting aids.
                The final published work must reflect meaningful human
                authorship, and any AI involvement in writing, cover
                art, or translation must be disclosed on the story page
                via the AI Disclosure field.
              </p>
              <p>
                Auror does not currently accept fully AI-generated works
                without substantial human authorship. Cover art generated
                by AI must comply with the underlying tool's licensing
                terms and the Akta Hak Cipta 1987 as it is amended to
                address AI authorship through 2026.
              </p>
            </>
          ),
        },
        {
          id: 'moderation',
          title: 'How moderation works',
          body: (
            <>
              <p>
                Reports go to a human moderator. Repeated or severe
                violations result in story takedown and, depending on
                the case, account suspension. Authors are notified in
                writing and have the right to appeal within 14 days.
              </p>
              <p>
                We maintain a moderation log retained for 12 months in
                line with the Content Code's recordkeeping guidance.
              </p>
            </>
          ),
        },
        {
          id: 'mcmc-and-content-forum',
          title: 'When you can escalate to MCMC or the Content Forum',
          body: (
            <>
              <p>
                If our moderation outcome doesn't address your concern,
                you can escalate:
              </p>
              <ul>
                <li>
                  The <strong>Content Forum</strong> under the Content
                  Code — for complaints about content classification,
                  offensive material, or misleading content. Their
                  Complaints Bureau handles mediation and adjudication.
                </li>
                <li>
                  The <strong>Malaysian Communications and Multimedia
                  Commission (MCMC)</strong> — for complaints under CMA
                  1998 §211–§233 (offensive / obscene / indecent /
                  menacing content) via{' '}
                  <a
                    href="https://www.mcmc.gov.my"
                    target="_blank"
                    rel="noreferrer"
                  >
                    mcmc.gov.my
                  </a>{' '}
                  or <a href="mailto:aduan@mcmc.gov.my">aduan@mcmc.gov.my</a>.
                </li>
                <li>
                  The <strong>Bahagian Penguatkuasa, Kementerian
                  Perdagangan Dalam Negeri dan Kos Sara Hidup (KPDN)</strong> —
                  for misleading conduct under Akta Perlindungan
                  Pengguna 1999.
                </li>
                <li>
                  The <strong>Royal Malaysia Police (PDRM)</strong> —
                  for criminal matters (e.g. threats, child safety,
                  harassment) under the Penal Code.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: 'reporting',
          title: 'Reporting content',
          body: (
            <>
              <p>
                Use the report button on any story or chapter page, or
                email{' '}
                <a href="mailto:moderation@auror.my">moderation@auror.my</a>
                {' '}with a link and a short note about the issue. We
                triage within 24 hours on weekdays.
              </p>
              <p>
                Anonymous reports are accepted; however, if you want a
                reply we will need a contact channel.
              </p>
            </>
          ),
        },
        {
          id: 'international-readers',
          title: 'International readers',
          body: (
            <p>
              If you are based outside Malaysia, you can still report
              content to us through the channels above. Where your home
              jurisdiction has additional protections (for example, the
              EU Digital Services Act or the UK Online Safety Act), we
              will honour those on top of Malaysian law.
            </p>
          ),
        },
        {
          id: 'changes',
          title: 'Changes to this policy',
          body: (
            <p>
              We'll announce material changes in-product at least 14
              days before they take effect. The "Last updated" date at
              the top of this page reflects the current version.
            </p>
          ),
        },
      ]}
    />
  );
}
