'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, Icon } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { uploadApi } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Props = {
  baseUrl: string;
};

export const SettingsView = ({ baseUrl }: Props): React.ReactElement => {
  const [payoutMethodRef, setPayoutMethodRef] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callAvatarUrl = useApiCall(uploadApi.avatarUploadUrl);

  const onUploadAvatar = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setBusy(true);
      setFeedback(null);
      try {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext ?? '')) {
          throw new Error('Unsupported image format. Use JPG, PNG, or WebP.');
        }
        const signed = await callAvatarUrl(ext as 'jpg' | 'jpeg' | 'png' | 'webp');
        if (!signed) throw new Error('Failed to mint upload URL.');

        const buf = await file.arrayBuffer();
        const putRes = await fetch(signed.public_url, {
          method: 'PUT',
          headers: { 'content-type': file.type },
          body: buf,
        });
        if (!putRes.ok) throw new Error(`Storage upload failed: ${putRes.status}`);

        setAvatarUrl(signed.public_url);
        setFeedback('Avatar uploaded. Save your profile to persist.');
      } catch (e) {
        setError(e);
        setFeedback(e instanceof Error ? e.message : 'Avatar upload failed.');
      } finally {
        setBusy(false);
      }
    },
    [callAvatarUrl, setError],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Avatar + payout method. Profile syncs to your Supabase `users` row.
        </p>
      </header>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-on-surface">Avatar</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                <Icon name="person" size={32} />
              </div>
            )}
          </div>
          <label className="cursor-pointer rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-semibold hover:bg-surface-container">
            {busy ? 'Uploading…' : 'Upload avatar'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void onUploadAvatar(e)}
              disabled={busy}
              className="hidden"
            />
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-on-surface">Payout method</h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          Reference token (e.g. Billplz collection ID, IBAN, or wallet address). Payouts
          are processed manually during phase 0 — the backend stores this as
          <code className="mx-1 rounded bg-surface-container px-1">payout_method_ref</code>.
        </p>
        <input
          type="text"
          value={payoutMethodRef}
          onChange={(e) => setPayoutMethodRef(e.currentTarget.value)}
          placeholder="e.g. BILLPLZ:abc123 or MAYBANK:1234567890"
          className="mt-3 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setFeedback('Payout method saved (in-memory only — Supabase write wired in Phase 2).')}
          className="mt-3 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white"
        >
          Save payout method
        </button>
      </Card>

      {feedback ? (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-4 text-sm">
          {feedback}
        </div>
      ) : null}

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-on-surface">Dev shortcuts</h2>
        <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
          <li>
            <Link href="/author/studio" className="text-primary hover:underline">/author/studio</Link>
            {' '}— your stories
          </li>
          <li>
            <Link href="/author/analytics" className="text-primary hover:underline">/author/analytics</Link>
            {' '}— read counts, followers
          </li>
          <li>
            <Link href="/author/earnings" className="text-primary hover:underline">/author/earnings</Link>
            {' '}— payout history
          </li>
        </ul>
      </Card>

      <noscript>
        <p className="text-xs text-on-surface-variant">
          Backend base: <code>{baseUrl || '(unset)'}</code>
        </p>
      </noscript>
    </div>
  );
};