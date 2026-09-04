/**
 * The data a template asks for, read off the document itself.
 *
 * Blocks carry a `showIfKey` and text carries variable pills, but nothing
 * anywhere records which keys a template uses — so the preview had no way to
 * offer them and the author had no way to check one. Walking the content is
 * enough: the document IS the list. A mistyped key shows up as an extra entry,
 * which is how you notice it.
 */

type Node = {
  text?: string;
  type?: string;
  attrs?: Record<string, unknown> | null;
  content?: Node[] | null;
};

export type TemplateDataKeys = {
  /** Keys read by "Show if" — booleans. */
  conditions: string[];
  /** Variable pill names — text. */
  variables: string[];
  /** The placeholder each pill carries, by name — the value previews and
   *  thumbnails show, and the seed for the editor's preview data. Never
   *  used on a real render. */
  placeholders: Record<string, string>;
  /** Where each variable first appears, so a finding can point at the block
   *  rather than leave the author hunting through the document. */
  where: Record<string, VariableLocation>;
};

export type VariableLocation = {
  /** The block that holds it: heading, paragraph, button, footer… */
  kind: string;
  /** The block's words, pills shown by name, cut short. */
  text: string;
};

const SNIPPET = 48;

/** The words of a block, with each pill as {{name}} so it can be found. */
function blockText(node: Node): string {
  const parts: string[] = [];
  const walk = (n: Node | null | undefined) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'text' && typeof n.text === 'string') parts.push(n.text);
    else if (n.type === 'variable') parts.push(`{{${String(n.attrs?.id ?? '')}}}`);
    for (const child of n.content ?? []) walk(child);
  };
  walk(node);
  const text = parts.join('').replace(/\s+/g, ' ').trim();
  return text.length > SNIPPET ? `${text.slice(0, SNIPPET - 1)}…` : text;
}

/** Blocks a pill can sit in; an inline node's location is its nearest one. */
const BLOCK_KINDS = new Set(['heading', 'paragraph', 'footer', 'button', 'image', 'logo', 'inlineImage']);

export function collectDataKeys(content: unknown): TemplateDataKeys {
  const conditions: string[] = [];
  const variables: string[] = [];
  const placeholders: Record<string, string> = {};
  const where: Record<string, VariableLocation> = {};
  const seenCondition = new Set<string>();
  const seenVariable = new Set<string>();

  const locate = (name: unknown, block: Node | null) => {
    if (typeof name !== 'string' || !name.trim() || !block || where[name.trim()]) return;
    const kind = block.type ?? 'block';
    const text = kind === 'button' ? String(block.attrs?.text ?? '') : blockText(block);
    where[name.trim()] = { kind, text };
  };

  const push = (list: string[], seen: Set<string>, value: unknown) => {
    if (typeof value !== 'string') return;
    const key = value.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    list.push(key);
  };

  const walk = (node: Node | null | undefined, block: Node | null) => {
    if (!node || typeof node !== 'object') return;
    const here = node.type && BLOCK_KINDS.has(node.type) ? node : block;

    push(conditions, seenCondition, node.attrs?.showIfKey);
    if (node.type === 'variable') {
      push(variables, seenVariable, node.attrs?.id);
      locate(node.attrs?.id, here);
      const fallback = node.attrs?.fallback;
      const id = typeof node.attrs?.id === 'string' ? node.attrs.id.trim() : '';
      if (id && typeof fallback === 'string' && fallback.trim() && !(id in placeholders)) placeholders[id] = fallback;
    }

    // A button's label can be a variable without being a variable node.
    if (node.attrs?.isTextVariable) {
      push(variables, seenVariable, node.attrs?.text);
      locate(node.attrs?.text, here);
    }
    if (node.attrs?.isUrlVariable) {
      push(variables, seenVariable, node.attrs?.url);
      locate(node.attrs?.url, here);
    }

    for (const child of node.content ?? []) walk(child, here);
  };

  walk(content as Node, null);
  return { conditions, variables, placeholders, where };
}
