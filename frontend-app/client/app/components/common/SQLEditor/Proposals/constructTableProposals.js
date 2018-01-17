const constructTableProposals = dataArray =>
  dataArray.map(data => ({
    label: data.name ? data.name : data,
    insertText: data.name ? `[[${data.name}]]` : data,
  }));

export default constructTableProposals;
