import type { Editor } from '@tiptap/core';
import { collectDataKeys } from '@temply/shared/template-data';
import type {
  VariableFunctionOptions,
  Variables,
  Variable,
} from '@/extensions';

export function processVariables(
  variables: Variables,
  options: VariableFunctionOptions
): Array<Variable> {
  const { query } = options;
  const queryLower = query.toLowerCase();

  let filteredVariables: Array<Variable> = [];
  if (Array.isArray(variables)) {
    filteredVariables = variables.filter((variable) =>
      variable.name.toLowerCase().startsWith(queryLower)
    );

    if (
      query.length > 0 &&
      !filteredVariables.some((variable) => variable.name === query)
    ) {
      filteredVariables.push({ name: query, required: true });
    }

    return filteredVariables;
  } else if (typeof variables === 'function') {
    return variables(options);
  } else {
    throw new Error(
      `Invalid variables type. Expected 'Array' or 'Function', but received '${typeof variables}'.`,
    );
  }
}

/**
 * Every name a variable field can offer: the ones this template already uses,
 * then the ones the app supplies. The document is the half that carries the
 * weight — nothing populates the app's list yet — so a name typed once is
 * offered everywhere after, which is the only reason the second variable in a
 * template is easier to write than the first.
 */
export function knownVariableNames(
  editor: Editor,
  variables: Variables | undefined,
  query: string,
  from: VariableFunctionOptions['from'],
): string[] {
  const needle = query.toLowerCase();
  const inDocument = collectDataKeys(editor.getJSON()).variables.filter((name) =>
    name.toLowerCase().includes(needle),
  );
  const offered = processVariables(variables ?? [], { query, from, editor }).map((variable) => variable.name);
  return [...new Set([...inDocument, ...offered])];
}
