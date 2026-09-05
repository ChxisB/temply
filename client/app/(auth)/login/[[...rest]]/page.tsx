import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignInCard } from '~/components/sign-in-card';

export default async function SignInPage() {
  const user = await currentUser();

  if (user) {
    redirect('/dashboard/templates');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-4">
      {/* The auth screen carried no Temply branding at all, so the first thing a
          new account saw was a stranger's product name. */}
      <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
        Temply
      </Link>
      <SignInCard />
      {/* Consent is collected by Clerk at sign-up; this line makes the terms
          visible before the button is pressed, which is what the terms
          themselves say happens. */}
      <p className="max-w-xs text-center text-xs text-muted">
        By continuing you agree to the{' '}
        <Link href="/terms" className="text-accent-ink underline-offset-4 hover:underline">
          terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-accent-ink underline-offset-4 hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </main>
  );
}

export const dynamic = 'force-dynamic';
