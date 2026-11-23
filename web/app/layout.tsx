import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';

import './global.css';

/*
 * Outfit, Geist Mono and Special Elite, loaded by the browser from Google
 * Fonts rather than downloaded at build time, so a build never depends on
 * reaching the font CDN.
 */
const FONTS =
  'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&family=Special+Elite&display=swap';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://suspect-genlayer.vercel.app'),
  title: { default: 'Suspect: an incident board where each cause has to survive every clue', template: '%s · Suspect' },
  description:
    'An incident board on GenLayer. A team pins the clues from an outage, members name suspects with a bond, validators test every suspect against every clue, one contradiction eliminates a suspect, and the survivors are ranked by what they explain.',
  openGraph: { siteName: 'Suspect', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#fde047', colorScheme: 'dark' };

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider theme={{ forcedTheme: 'dark', defaultTheme: 'dark', enableSystem: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
