import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { GoogleAnalytics } from '~/components/google-analytics';
import { Providers } from './providers';
import '../core/styles/index.css';
import './globals.css';

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
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          />
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
