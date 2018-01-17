import createSQLSnippetsProposals from './sqlSnippets';
import dateFunctions from './dateFunctions';
const createSelectContextProposals = monaco => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  const dateFunctionsProposals = dateFunctions(monaco);
  return [
    {
      label: 'FROM',
      kind: monaco.languages.CompletionItemKind.Keyword,
      documentation: 'FROM - keyword',
      insertText: '\nFROM ',
    },
    {
      label: 'COUNT()',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'COUNT - keyword',
      insertText: 'COUNT()',
    },
    {
      label: 'COUNT DISTINCT()',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'FROM - keyword',
      insertText: 'COUNT(DISTINCT )',
    },
    {
      label: 'SUM()',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'SUM - keyword',
      insertText: 'SUM()',
    },
    {
      label: 'MIN()',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'MIN - keyword',
      insertText: 'MIN()',
    },
    {
      label: 'MAX()',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'MAX - keyword',
      insertText: 'MAX()',
    },
    {
      label: 'AVERAGE()',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'AVG - keyword',
      insertText: 'AVG()',
    },
    {
      label: 'MEDIAN()',
      kind: monaco.languages.CompletionItemKind.Property,
      documentation: 'MEDIAN - keyword',
      insertText: 'MEDIAN()',
    },
    ...sqlSnippets,
    ...dateFunctionsProposals,
  ];
};

export default createSelectContextProposals;
