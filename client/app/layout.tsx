import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { GoogleAnalytics } from '~/components/google-analytics';
import { Providers } from './providers';
import '../core/styles/index.css';
import './globals.css';

// Self-hosted and subset at build time, so no render-blocking request to a
// third-party origin. Mono is not decorative: this product shows short codes,
// curl commands, API URLs and hex values, and those want a real monospace.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Temply - Beautiful email templates, built fast',
  description:
    'Temply is a drag-and-drop email template builder that makes crafting stunning, responsive emails effortless.',
  twitter: {
    card: 'summary_large_image',
    title: 'Temply - Beautiful email templates, built fast',
    description:
      'Temply is a drag-and-drop email template builder that makes crafting stunning, responsive emails effortless.',
    images: ['https://temply.app/og-image.png'],
  },
  openGraph: {
    siteName: 'Temply',
    title: 'Temply - Beautiful email templates, built fast',
    description:
      'Temply is a drag-and-drop email template builder that makes crafting stunning, responsive emails effortless.',
    images: ['https://temply.app/og-image.png'],
  },
  icons: {
    icon: '/brand/logo.svg',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${plexSans.variable} ${plexMono.variable}`}
      >
        <head>
          <GoogleAnalytics />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('theme');
                    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  } catch(e) {}
                })();
              `,
            }}
          />
        </head>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
