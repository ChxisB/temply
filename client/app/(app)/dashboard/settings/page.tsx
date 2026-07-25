'use client';

import { UserProfile } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Manage your account settings and preferences.
        </p>
      </div>

      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'border border-gray-200 dark:border-white/10 shadow-none w-full',
            navbar: 'hidden',
            pageScrollBox: 'p-0',
          },
        }}
      />
    </div>
  );
}
