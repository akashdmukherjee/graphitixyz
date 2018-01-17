import createSQLSnippetsProposals from './sqlSnippets';

const createJoinContextProposals = monaco => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  return [
    {
      label: 'ON',
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: 'ON ',
    },
    ...sqlSnippets,
  ];
};

export default createJoinContextProposals;
