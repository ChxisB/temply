import { SignIn } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const user = await currentUser();

  if (user) {
    redirect('/templates');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn signUpForceRedirectUrl="/templates" />
    </div>
  );
}

export const dynamic = 'force-dynamic';
