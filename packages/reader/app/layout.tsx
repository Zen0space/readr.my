import type { Metadata, Viewport } from 'next';
import { DM_Sans, Inter } from 'next/font/google';
import { Provider as JotaiProvider } from 'jotai';
import './globals.css';

const display = DM_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Auror — Enter the Realm of Deep Flow',
    template: '%s · Auror',
  },
  description:
    'Discover Malaysian-authored stories on Auror — a self-hosted reading platform.',
  applicationName: 'Auror',
  authors: [{ name: 'Auror' }],
  keywords: ['reading', 'malaysia', 'stories', 'auror'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcf8ff' },
    { media: '(prefers-color-scheme: dark)', color: '#131318' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-on-background font-body antialiased">
        <JotaiProvider>{children}</JotaiProvider>
      </body>
    </html>
  );
}