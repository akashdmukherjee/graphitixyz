import {
  createFromContextProposals,
  createSelectContextProposals,
  createWhereContextProposals,
  createGroupByContextProposals,
  createOrderByContextProposals,
  createHavingContextProposals,
  createJoinContextProposals,
  createONContextProposals,
  createKeywordsProposals,
} from './Proposals';
import constructTableProposals from './Proposals/constructTableProposals';
import {
  constructDataSetColumnNamesProposals,
  constructTableColumnNamesProposals,
} from './Proposals/constructColumnNamesProposals';
import { SQLSnippets } from './Proposals/sqlSnippets';
import {
  getColumnNamesOfAnAsset,
  getDataAssets,
  getTableNamesFromConnector,
  getColumnNamesOfTable,
} from './api';
import workerMessageTypes from './workerMessageTypes';

const sources = {
  GRAPHITI: 'GRAPHITI',
  EXTERNAL: 'EXTERNAL',
};
// patterns for columnNames autocompletion
const patterns = {
  GRAPHITI: /.*(=|\w+\(|\s|,)\[\[(.*)\]\]\./,
  EXTERNAL: /.*(=|\w+\(|\s|,)(.*)\./,
};
let oldAssetId = null;
let activeSource = sources.GRAPHITI;
let wordBeforeDot = '';
// dataSets stores the result from ajax request
let dataSets = null;
// tables stores the result from ajax request
let tables = null;
let connectionId = null;
// this stores all the proposals
const dynamicContextProposals = {
  dataSets: [],
  tables: [],
  columnNames: {},
};

// make an API request for dataSets
// and construct dataSets proposals
const dataSetsProposals = apiData =>
  getDataAssets(apiData).then(result => {
    // console.info(dynamicContextProposals);
    dataSets = result.data.accessibleDataAssetInformation;
    const proposals = constructTableProposals(dataSets);
    dynamicContextProposals.dataSets = proposals;
  });

// make an API request for dataSets
// and construct dataSets proposals
const tableNamesProposals = apiData => {
  getTableNamesFromConnector(apiData).then(result => {
    // console.info(dynamicContextProposals);
    tables = result.data.tableNames;
    const proposals = constructTableProposals(tables);
    dynamicContextProposals.tables = proposals;
  });
};

// make an API request for columnNames of a DataSet
// and construct columnNames proposals
const columnNamesProposals = (name, apiData) => {
  const newApiData = { ...apiData };
  if (activeSource === sources.GRAPHITI) {
    if (dataSets && dataSets.length === 0) return [];
    const dataSetAssetId = dataSets.find(data => data.name === name).id;
    newApiData.assetId = dataSetAssetId;
    return getColumnNamesOfAnAsset(newApiData).then(result => {
      const proposals = constructDataSetColumnNamesProposals(result.data);
      dynamicContextProposals.columnNames[name] = proposals;
      return Promise.resolve(proposals);
    });
  }
  newApiData.connectionId = connectionId;
  newApiData.tableName = name;
  return getColumnNamesOfTable(newApiData).then(result => {
    const proposals = constructTableColumnNamesProposals(result.data.columnNames);
    dynamicContextProposals.columnNames[name] = proposals;
    return Promise.resolve(proposals);
  });
};

const registerCompletionItemProvider = (editor, monaco, apiData) => {
  const staticContextProposals = {
    from: createFromContextProposals(monaco),
    select: createSelectContextProposals(monaco),
    where: createWhereContextProposals(monaco),
    having: createHavingContextProposals(monaco),
    join: createJoinContextProposals(monaco),
    on: createONContextProposals(monaco),
    'group by': createGroupByContextProposals(monaco),
    'order by': createOrderByContextProposals(monaco),
  };

  window.addEventListener(
    'message',
    e => {
      const { type, data } = e.data;
      // console.info(type, data);
      if (type === workerMessageTypes.CONNECTION_ID) {
        if (data) {
          connectionId = data;
          const newApiData = { ...apiData };
          newApiData.connectionId = connectionId;
          console.info('tableNamesProposals');
          tableNamesProposals(newApiData);
          activeSource = sources.EXTERNAL;
        }
      }
      if (type === workerMessageTypes.NEW_RENDER) {
        if (oldAssetId !== data) {
          activeSource = sources.GRAPHITI;
          oldAssetId = data;
        }
      }
    },
    false
  );

  dataSetsProposals(apiData);

  monaco.languages.registerCompletionItemProvider('sql', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const contextMatch = model.findPreviousMatch(
        '\\b(select|from|where|join|on|group by|order by|having)\\b',
        position,
        true,
        false,
        false,
        true
      );

      const currentRange = new monaco.Range(
        position.lineNumber,
        position.column - 1,
        position.lineNumber,
        position.column
      );
      const currentTriggerValue = model.getValueInRange(currentRange);
      // console.info(dotMatch, contextMatch, position, model.getValue());

      // webWorker.postMessage('Hello' + model.getValue());

      // const tableMatch = model.findNextMatch('', position, false, false, false, true);
      // console.info(tableMatch);
      if (currentTriggerValue === '.') {
        const range = new monaco.Range(
          position.lineNumber,
          1,
          position.lineNumber,
          position.column
        );

        const valueInRange = model.getValueInRange(range);
        const tableMatch = patterns[activeSource].exec(valueInRange);

        // console.info(valueInRange, tableMatch);

        if (tableMatch && tableMatch.length) {
          // wordBeforeDot is dataSetName
          // i.e [[dataSetName]].columnName
          wordBeforeDot = tableMatch[2];

          // first check if current dataSetName has
          // already cached columnNamesProposals
          const proposals = dynamicContextProposals.columnNames[wordBeforeDot];
          if (proposals) {
            return proposals;
          }
          return columnNamesProposals(wordBeforeDot, apiData);
        }
      }

      if (contextMatch) {
        const matchedContextualKeyword = contextMatch.matches[0].toLowerCase();
        const dynamicProposalsList =
          activeSource === sources.GRAPHITI
            ? dynamicContextProposals.dataSets
            : dynamicContextProposals.tables;
        return [...staticContextProposals[matchedContextualKeyword], ...dynamicProposalsList];
      }
      return createKeywordsProposals(monaco);
    },
  });

  editor.onDidChangeModelContent(event => {
    const { range, text } = event;
    const newRange = new monaco.Range(
      range.startLineNumber,
      range.startColumn,
      range.endLineNumber,
      range.startColumn + text.length - 1
    );
    const sqlSnippet = SQLSnippets[text.trim()];
    if (sqlSnippet) {
      // console.info(range, text, newRange);
      editor.deltaDecorations(
        [],
        [{ range: newRange, options: { inlineClassName: 'sql-snippet' } }]
      );
      monaco.languages.registerHoverProvider('sql', {
        provideHover(model, position) {
          return {
            range: newRange,
            contents: [
              `SQL ASSET **${sqlSnippet.label}**`,
              { language: 'sql', value: sqlSnippet.documentation },
            ],
          };
        },
      });
    }
  });
};

export default registerCompletionItemProvider;
