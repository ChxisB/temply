import type { JSONContent } from '@tiptap/core';
import { Engine } from './engine';
import type { EngineConfig, RenderOptions } from './engine';

export async function render(
  content: JSONContent,
  config?: EngineConfig & RenderOptions
): Promise<string> {
  const { theme, preview, ...rest } = config || {};

  const engine = new Engine(content);
  engine.setPreviewText(preview);
  engine.setTheme(theme || {});

  return engine.render(rest);
}
