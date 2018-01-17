import createSQLSnippetsProposals from './sqlSnippets';
import dateFunctions from './dateFunctions';

const createWhereContextProposals = monaco => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  const dateFunctionsProposals = dateFunctions(monaco);
  return [
    {
      label: 'GROUP BY',
      kind: monaco.languages.CompletionItemKind.Keyword,
      documentation: 'GROUP BY',
      insertText: '\nGROUP BY ',
    },
    ...sqlSnippets,
    ...dateFunctionsProposals,
  ];
};

export default createWhereContextProposals;
