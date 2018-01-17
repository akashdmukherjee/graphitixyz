import createSQLSnippetsProposals from './sqlSnippets';
import createSelectContextProposals from './selectContext';
import dateFunctions from './dateFunctions';

const createGroupByContextProposals = (monaco) => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  const columns = createSelectContextProposals(monaco).filter(proposal => proposal.label !== 'FROM');
  const dateFunctionsProposals = dateFunctions(monaco);
  return [
    {
      label: 'ORDER BY',
      kind: monaco.languages.CompletionItemKind.Keyword,
      documentation: 'ORDER BY',
      insertText: '\nORDER BY ',
    },
    {
      label: 'HAVING',
      kind: monaco.languages.CompletionItemKind.Keyword,
      documentation: 'HAVING',
      insertText: '\nHAVING ',
    },
    ...sqlSnippets,
    ...columns,
    ...dateFunctionsProposals,
  ];
};

export default createGroupByContextProposals;
