const patterns = {
  GRAPHITI: /.*(\w+\(|\s|,)\[\[(.*)\]\]\./,
  EXTERNAL: /.*(\w+\(|\s|,)(.*)\./,
};

const sources = {
  GRAPHITI: 'GRAPHITI',
  EXTERNAL: 'EXTERNAL',
};

const datas = [
  {
    text: 'SELECT [[pl]].column,[[po]].s,   [[asset-name]].',
    source: sources.GRAPHITI,
  },
  {
    text: 'SELECT [[pl]].column,[[po]].s,[[related-assets-data-1]].',
    source: sources.GRAPHITI,
  },
  {
    text: 'SELECT [[pl]].column, [[po]].s, [[asset-name]].',
    source: sources.GRAPHITI,
  },
  {
    text: 'SELECT pl.column,po.s, tablename.',
    source: sources.EXTERNAL,
  },
    {
    text: 'SELECT COUNT(aggregation_external.',
    source: sources.EXTERNAL,
  },
    {
    text: 'SELECT EXTRACT MONTH([[aggregation_graphiti]].',
    source: sources.GRAPHITI,
  },
];

datas.forEach(data => {
  const match = patterns[data.source].exec(data.text);
  console.info(match ? match[2] : 'No Match');
});
