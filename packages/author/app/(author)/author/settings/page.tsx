import type { Metadata } from 'next';
import { SettingsView } from '@/components/author/SettingsView';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your author profile and payout method.',
};

export default async function SettingsPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  return <SettingsView baseUrl={baseUrl} />;
}