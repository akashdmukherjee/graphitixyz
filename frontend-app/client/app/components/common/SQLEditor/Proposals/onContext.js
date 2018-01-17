import createSQLSnippetsProposals from './sqlSnippets';
import dateFunctions from './dateFunctions';

const createONContextProposals = monaco => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  const dateFunctionsProposals = dateFunctions(monaco);
  return [
    {
      label: 'WHERE',
      kind: monaco.languages.CompletionItemKind.Field,
      documentation: 'WHERE',
      insertText: '\nWHERE ',
    },
    ...sqlSnippets,
    ...dateFunctionsProposals,
  ];
};

export default createONContextProposals;
