import { EditorHeader } from '~/components/editor-header';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <EditorHeader />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
