const dateFunctions = (monaco) => {
  return [
    {
      label: 'YEAR()',
      kind: monaco.languages.CompletionItemKind.Field,
      documentation: 'EXTRACT(YEAR FROM )',
      insertText: 'EXTRACT(YEAR FROM )',
      filterText: 'EXTRACT(YEAR FROM )',
    },
    {
      label: 'QUARTER()',
      kind: monaco.languages.CompletionItemKind.Field,
      documentation: 'EXTRACT(QUARTER FROM )',
      insertText: 'EXTRACT(QUARTER FROM )',
      filterText: 'EXTRACT(QUARTER FROM )',
    },
    {
      label: 'MONTH()',
      kind: monaco.languages.CompletionItemKind.Field,
      documentation: 'EXTRACT(MONTH FROM )',
      insertText: 'EXTRACT(MONTH FROM )',
      filterText: 'EXTRACT(MONTH FROM )',
    },
    {
      label: 'DAY NUMBER()',
      kind: monaco.languages.CompletionItemKind.Field,
      documentation: 'EXTRACT(DAY FROM )',
      insertText: 'EXTRACT(DAY FROM )',
      filterText: 'EXTRACT(DAY FROM )',
    },
    {
      label: 'DAY NAME()',
      kind: monaco.languages.CompletionItemKind.Field,
      documentation: 'TO_CHAR(, \'DAY\')',
      insertText: 'TO_CHAR(, \'DAY\')',
      filterText: 'TO_CHAR(, \'DAY\')',
    },
  ];
};

export default dateFunctions;
