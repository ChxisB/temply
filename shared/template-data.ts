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
  type?: string;
  attrs?: Record<string, unknown> | null;
  content?: Node[] | null;
};

export type TemplateDataKeys = {
  /** Keys read by "Show if" — booleans. */
  conditions: string[];
  /** Variable pill names — text. */
  variables: string[];
  /** The subset of variables that carry a fallback, so an absent value still
   *  renders as words rather than as the placeholder. */
  withFallback: string[];
};

export function collectDataKeys(content: unknown): TemplateDataKeys {
  const conditions: string[] = [];
  const variables: string[] = [];
  const withFallback: string[] = [];
  const seenCondition = new Set<string>();
  const seenVariable = new Set<string>();
  const seenFallback = new Set<string>();

  const push = (list: string[], seen: Set<string>, value: unknown) => {
    if (typeof value !== 'string') return;
    const key = value.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    list.push(key);
  };

  const walk = (node: Node | null | undefined) => {
    if (!node || typeof node !== 'object') return;

    push(conditions, seenCondition, node.attrs?.showIfKey);
    if (node.type === 'variable') {
      push(variables, seenVariable, node.attrs?.id);
      const fallback = node.attrs?.fallback;
      if (typeof fallback === 'string' && fallback.trim()) push(withFallback, seenFallback, node.attrs?.id);
    }

    // A button's label can be a variable without being a variable node.
    if (node.attrs?.isTextVariable) push(variables, seenVariable, node.attrs?.text);
    if (node.attrs?.isUrlVariable) push(variables, seenVariable, node.attrs?.url);

    for (const child of node.content ?? []) walk(child);
  };

  walk(content as Node);
  return { conditions, variables, withFallback };
}
