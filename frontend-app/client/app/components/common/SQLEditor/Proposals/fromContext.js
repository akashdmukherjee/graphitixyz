import createSQLSnippetsProposals from './sqlSnippets';

const createFromContextProposals = monaco => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  return [
    {
      label: 'JOIN',
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: '\nJOIN ',
    },
    {
      label: 'WHERE',
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: '\nWHERE ',
    },
    {
      label: 'GROUP BY',
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: '\nGROUP BY ',
    },
    ...sqlSnippets,
  ];
};

export default createFromContextProposals;
