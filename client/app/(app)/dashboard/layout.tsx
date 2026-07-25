import { Sidebar } from '~/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden w-60 shrink-0 md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-auto">
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
