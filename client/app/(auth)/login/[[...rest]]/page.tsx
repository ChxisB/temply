import { SignIn } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const user = await currentUser();

  if (user) {
    redirect('/dashboard/templates');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Point straight at the destination. Bouncing through an intermediate
          redirect-only route left OAuth callbacks stranded on that route. */}
      <SignIn signUpForceRedirectUrl="/dashboard/templates" />
    </div>
  );
}

export const dynamic = 'force-dynamic';
