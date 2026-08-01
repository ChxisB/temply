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
    </main>
  );
}

export const dynamic = 'force-dynamic';
