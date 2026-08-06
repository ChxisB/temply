import type { JSONContent } from '@tiptap/core';
import { Engine } from './engine';
import type { EngineConfig, RenderOptions } from './engine';

export async function render(
  content: JSONContent,
  config?: EngineConfig & RenderOptions
): Promise<string> {
  const { theme, preview, payload, ...rest } = config || {};

  const engine = new Engine(content);
  engine.setPreviewText(preview);
  engine.setTheme(theme || {});
  // Supplying data — even an empty object — is what switches the engine from
  // "composing" to "rendering for a recipient": variables resolve and
  // conditions are evaluated.
  if (payload) {
    engine.setShouldReplaceVariableValues(true);
    engine.setPayloadValues(payload);
  }

  return engine.render(rest);
}
