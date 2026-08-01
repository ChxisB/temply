'use client';

import { UserProfile } from '@clerk/nextjs';
import { useTheme } from '~/components/theme-provider';
import { PageHeader } from '~/components/ui/surfaces';

export default function SettingsPage() {
  // Clerk renders its own DOM and cannot read our CSS variables, so the theme
  // has to be handed to it. Without this the account panel stayed light while
  // the rest of the app went dark — a white card floating on a dark page.
  const { clerkAppearance } = useTheme();

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Your account and how you sign in." />

      <UserProfile
        appearance={{
          ...clerkAppearance,
          elements: {
            ...(clerkAppearance.elements as Record<string, string>),
            rootBox: 'w-full',
            cardBox: 'w-full shadow-none border border-line rounded-lg',
            card: 'w-full shadow-none',
            navbar: 'hidden',
            pageScrollBox: 'p-0',
          },
        }}
      />
    </div>
  );
}
