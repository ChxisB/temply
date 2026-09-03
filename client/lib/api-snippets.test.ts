import { describe, expect, it } from 'bun:test';
import { PUBLIC_RENDER_ROUTE, PUBLIC_TEMPLATE_ROUTE, publicRenderPath, publicTemplatePath } from '@temply/shared/api';
import { API_ORIGIN, metaSnippet, renderSnippets, SNIPPET_LANGUAGES } from './api-snippets';

/**
 * The snippets are what an integrator pastes. Each one has to hit the path
 * the server actually serves, send the key the way the server reads it, and
 * post a data object the render endpoint accepts.
 */
describe('API snippets', () => {
  const code = 'tpl_AbCd1234';
  const snippets = renderSnippets(code);

  it('cover every language the switch offers', () => {
    expect(Object.keys(snippets).sort()).toEqual(SNIPPET_LANGUAGES.map((l) => l.id).sort());
  });

  for (const { id } of SNIPPET_LANGUAGES) {
    it(`${id} posts to the render route with a bearer key and a data object`, () => {
      const snippet = snippets[id];
      expect(snippet).toContain(`${API_ORIGIN}${publicRenderPath(code)}`);
      expect(snippet).toMatch(/Bearer tply_live_/);
      expect(snippet).toContain('firstName');
      expect(snippet).toContain('isMember');
    });
  }

  it('the paths match the server’s route patterns', () => {
    expect(publicRenderPath(code)).toBe(PUBLIC_RENDER_ROUTE.replace(':shortCode', code));
    expect(publicTemplatePath(code)).toBe(PUBLIC_TEMPLATE_ROUTE.replace(':shortCode', code));
  });

  it('the metadata call reads the template route', () => {
    expect(metaSnippet(code)).toContain(`${API_ORIGIN}${publicTemplatePath(code)}`);
  });
});
