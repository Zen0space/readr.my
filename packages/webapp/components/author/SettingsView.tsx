'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Card, Icon, Input, Textarea } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { uploadApi } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Props = {
  initialUsername: string;
  initialEmail: string;
  initialAvatar: string | null;
  isAuthed: boolean;
};

export const SettingsView = ({
  initialUsername,
  initialEmail,
  initialAvatar,
  isAuthed,
}: Props): React.ReactElement => {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callUpload = useApiCall(uploadApi.file);

  const onAvatarChange = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const result = await callUpload(file, 'avatars');
        if (result) setAvatar(result.url);
      } catch (e) {
        setError(e);
        setFeedback(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setBusy(false);
      }
    },
    [callUpload, setError],
  );

  const onSave = useCallback(async () => {
    setBusy(true);
    setFeedback(null);
    try {
      // TODO: wire to /api/author/profile once backend exposes a PATCH route
      // For now, the typed client doesn't have a profile-update endpoint;
      // we surface the input state so the form is testable.
      setFeedback('Profile changes saved locally. Backend PATCH pending.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [router]);

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="settings" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to edit your settings</h2>
        <Link
          href="/login?redirect=/author/settings"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Author settings</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Profile, avatar, and contact info.</p>
      </header>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-on-surface">Avatar</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar src={avatar} alt={username} size="xl" fallback={username} />
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary">
            <Icon name="image" size={16} />
            Upload new
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) void onAvatarChange(file);
              }}
            />
          </label>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold text-on-surface">Profile</h2>
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <Textarea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.currentTarget.value)}
          rows={4}
          placeholder="Tell readers a little about yourself."
        />
      </Card>

      {feedback ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          {feedback}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={() => { void onSave(); }} isLoading={busy}>
          <Icon name="check" size={16} />
          Save changes
        </Button>
      </div>
    </div>
  );
};
