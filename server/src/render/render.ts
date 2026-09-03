import type { JSONContent } from '@tiptap/core';
import { Engine } from './engine';
import type { EngineConfig, RenderOptions } from './engine';

export async function render(
  content: JSONContent,
  config?: EngineConfig &
    RenderOptions & {
      /**
       * Composing mode, but with each pill drawn as its fallback rather than
       * as `{{name}}` — for a thumbnail, where "Hi there" reads as an email
       * and "Hi {{firstName,fallback=there}}" reads as a template. A pill
       * with no fallback still shows its placeholder.
       */
      showFallbacks?: boolean;
    }
): Promise<string> {
  const { theme, preview, payload, showFallbacks, ...rest } = config || {};

  const engine = new Engine(content);
  engine.setPreviewText(preview);
  engine.setTheme(theme || {});
  if (showFallbacks) {
    engine.setVariableFormatter(({ variable, fallback }) => fallback ?? `{{${variable}}}`);
  }
  // Supplying data — even an empty object — is what switches the engine from
  // "composing" to "rendering for a recipient": variables resolve and
  // conditions are evaluated.
  // The routes accept payload as t.Any(), so any JSON shape arrives here.
  // Only a plain object is data — a string would hand Object.entries its
  // characters as keys.
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    engine.setShouldReplaceVariableValues(true);
    engine.setPayloadValues(payload);
    // The payload map only feeds "Show if" and repeat lookups; variable pills
    // read the variable-values map, so the flat text entries go there too or
    // {{name}} never resolves.
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' || typeof value === 'number') {
        engine.setVariableValue(key, String(value));
      }
    }
  }

  return engine.render(rest);
}
