import { Editor, type JSONContent } from '@tiptap/core';
import { extensions } from '../extensions';
import { BlockSelection } from '../plugins/block-selection';

// Builds a real tiptap editor against the app's extension set, with no React
// tree — for unit tests that exercise ProseMirror-level commands directly.
export function makeEditor(content: JSONContent, opts: { touch?: boolean } = {}): Editor {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const editor = new Editor({
    element,
    content,
    extensions: [...extensions({}), ...(opts.touch ? [BlockSelection] : [])],
  });
  // EditorView.destroy() only tears down its own contenteditable inside
  // element, never element itself, which would otherwise pile up orphans on
  // the one happy-dom document shared by the whole test process.
  editor.on('destroy', () => element.remove());
  return editor;
}
