import { MobileNav } from '~/components/dashboard/mobile-nav';
import { Sidebar } from '~/components/dashboard/sidebar';
import { ThemeToggle } from '~/components/theme-toggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <div className="hidden w-56 shrink-0 md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Carries the drawer trigger on narrow viewports; on wide ones the
            sidebar owns navigation and this bar only holds the theme switch. */}
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line px-3 md:justify-end md:px-4">
          <MobileNav />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
