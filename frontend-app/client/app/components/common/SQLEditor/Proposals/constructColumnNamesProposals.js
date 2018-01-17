export const constructDataSetColumnNamesProposals = data => {
  return Object.keys(data).map(columnName => ({
    label: columnName,
    documentation: `Datatype: ${data[columnName]}`,
  }));
};

export const constructTableColumnNamesProposals = data => {
  return data.map(columnName => ({
    label: columnName,
  }));
};
