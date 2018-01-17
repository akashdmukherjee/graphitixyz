import createSQLSnippetsProposals from './sqlSnippets';
import createSelectContextProposals from './selectContext';
import dateFunctions from './dateFunctions';

const createOrderByContextProposals = (monaco) => {
  const sqlSnippets = createSQLSnippetsProposals(monaco);
  const orderByColumns = createSelectContextProposals(monaco).filter(proposal => proposal.label !== 'FROM');
  const newOrderByColumns = [];
  orderByColumns.forEach((proposal) => {
    const object = Object.assign({}, proposal);
    newOrderByColumns.push({
      documentation: object.documentation,
      kind: object.kind,
      label: object.label + ' ASC',
      insertText: object.insertText + ' ASC',
    });
  });
  const dateFunctionsProposals = dateFunctions(monaco);
  return [
    ...sqlSnippets,
    ...newOrderByColumns,
    ...dateFunctionsProposals,
  ];
};

export default createOrderByContextProposals;
