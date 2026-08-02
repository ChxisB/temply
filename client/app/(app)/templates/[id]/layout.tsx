import { EditorHeader } from '~/components/editor-header';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-surface">
      <EditorHeader />
      {/* The editor content had no padding or width cap, so the fields and the
          brand panel ran edge to edge. Match the dashboard's gutter and
          measure. */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}
