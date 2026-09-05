import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google';
import { GoogleAnalytics } from '~/components/google-analytics';
import { Providers } from './providers';
import { SITE_URL } from '~/lib/site';
import '../core/styles/index.css';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  // Every relative URL below — the OG image, canonical links — resolves
  // against this, so the domain lives in one environment variable.
  metadataBase: new URL(SITE_URL),
  title: 'Temply — write the email, we handle the HTML',
  description:
    'A block editor for transactional email. Build it without code, send it from your own app.',
  twitter: {
    card: 'summary_large_image',
    title: 'Temply — write the email, we handle the HTML',
    description:
      'A block editor for transactional email. Build it without code, send it from your own app.',
    images: ['/og-image.png'],
  },
  openGraph: {
    siteName: 'Temply',
    title: 'Temply — write the email, we handle the HTML',
    description:
      'A block editor for transactional email. Build it without code, send it from your own app.',
    images: ['/og-image.png'],
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
    <ClerkProvider
      // Signing out — and deleting the account, which signs out — lands on
      // the front page, not on whatever settings sub-path Clerk was showing.
      afterSignOutUrl="/"
      // A finished sign-up goes to the dashboard wherever the flow ran —
      // the card on /login or Clerk's own verification screens — and so
      // does a sign-in that arrived with nowhere particular to return to.
      // Without these Clerk falls back to "/", the marketing page.
      signUpForceRedirectUrl="/onboarding"
      signInFallbackRedirectUrl="/dashboard"
      // Clerk otherwise titles its screens after the instance name, so the
      // sign-in page for Temply read "Sign in to My Application".
      localization={{
        signIn: {
          start: {
            title: 'Sign in to Temply',
            subtitle: 'Pick up where you left off.',
          },
        },
        signUp: {
          start: {
            title: 'Create your Temply account',
            subtitle: 'Save the emails you build and send them from your own app.',
          },
        },
      }}
    >
      {/* The font variables go on <body>, not <html>. Giving <html> a
          className hands it to React, which then reconciles it on hydration and
          strips the `dark` class the blocking script below just added — so a
          full page load would drop the user's chosen theme. */}
      <html lang="en" suppressHydrationWarning>
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
        <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>
          {/* First focusable element on the page. Lets a keyboard user jump the
              header and sidebar straight to the content. */}
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
