const createKeywordsProposals = monaco => {
  return [
    {
      label: 'SELECT',
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: 'SELECT ',
    },
  ];
};

export default createKeywordsProposals;
