import createSQLSnippetsProposals from './sqlSnippets';
import createSelectContextProposals from './selectContext';
import dateFunctions from './dateFunctions';

const createHavingContextProposals = (monaco) => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  const orderByColumns = createSelectContextProposals(monaco).filter(proposal => proposal.label !== 'FROM');
  const dateFunctionsProposals = dateFunctions(monaco);
  const newOrderByColumns = [];
  orderByColumns.forEach((proposal) => {
    const object = Object.assign({}, proposal);
    newOrderByColumns.push({
      documentation: object.documentation,
      kind: object.kind,
      label: `COUNT(${object.label})`,
      insertText: `COUNT(${object.label})`,
    });
  });
  return [
    ...sqlSnippets,
    ...newOrderByColumns,
    ...dateFunctionsProposals,
  ];
};

export default createHavingContextProposals;
