/*eslint-disable*/
function send(url, method, data, headers, async) {
  if (async === undefined) {
    async = true;
  }

  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.timeout = 3000; // 3s timeout

    xhr.open(method, url, async);

    if (headers) {
      for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, headers[key]);
        }
      }
    }

    if (method === 'POST') {
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }

    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };

    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };

    xhr.ontimeout = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };

    xhr.send(data);
  });
}

var ajax = {
  get: function(url, data, headers, async) {
    var query = [];
    for (var key in data) {
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    return send(url + (query.length ? '?' + query.join('&') : ''), 'GET', null, headers, async);
  },

  post: function(url, data, headers, async) {
    var query = [];
    for (var key in data) {
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    return send(url, 'POST', query.join('&'), headers, async);
  }
};

var assetServiceHost = 'http://localhost:9090/ext/asset/';
var connectorServiceHost = 'http://localhost:8090/api/ext/cache/dataAsset/';
var getDataAssets = function(data) {
  const url = assetServiceHost + data.memberId + '/accessibleDataAssets';
  return ajax.get(
    url,
    {},
    {
      'graphiti-tid': Math.random(),
      memberId: data.memberId,
      orgId: data.orgId
    }
  );
};

var getColumnNamesOfAnAsset = function(data) {
  const url = connectorServiceHost + data.assetId + '/columnNames';
  return ajax.get(
    url,
    {},
    {
      'graphiti-tid': Math.random(),
      memberId: data.memberId,
      orgId: data.orgId
    }
  );
};

var apiData = null;
var connectionId = null;
var assetId = null;

var workerMessageTypes = {
  CONNECTION_ID: 'CONNECTION_ID',
  API_DATA: 'API_DATA',
  ASSET_ID: 'ASSET_ID',
  GET_DATASETS: 'GET_DATASETS',
  GET_TABLE_NAMES: 'GET_TABLE_NAMES',
  GET_DATASET_COLUMNNAMES: 'GET_DATASET_COLUMNNAMES',
  GET_TABLE_COLUMNNAMES: 'GET_TABLE_COLUMNNAMES'
};

var dataAssets = [
  { name: 'MyAssetasd124', id: '1a23b45a-0487-442c-bb9f-31c18d9afc58' },
  { name: 'StudentRecords', id: '34d52078-58eb-4374-92f0-86c5311f310f' },
  { name: 'StudentRecords', id: 'b1e71844-c485-4fe4-86a1-6b156b8310fc' },
  { name: 'DevajitTEST', id: 'c48c369b-862c-41db-b754-029e30e2511a' },
  { name: 'DevajitTEST_1', id: 'bfedca17-7d93-4a2d-bc00-60fd66878403' },
  { name: 'DevajitTEST_1_DATASET', id: 'b4cdde4e-1fe9-42d6-95a9-105f7f16953e' },
  { name: 'DevajitENDORSE', id: 'd78554b5-3fae-49fa-beb1-b8914c34373b' },
  { name: 'DATASET - TEST_', id: 'd0dadf24-8f7e-4cc5-be07-56e7041b0280' },
  { name: 'DATASET - TEST_', id: '2873de6b-5322-416f-9ea6-b1fae55e7b2b' },
  { name: 'DATASET - TEST_', id: 'fe3a9de1-97c9-4941-93ef-979242dca522' },
  { name: 'DATASET - TEST_', id: '3179e0dd-c388-4baf-88fb-c7bc1b8ec153' },
  { name: 'DATASET - NEW ASSET', id: 'b3408bd0-1762-4ad6-87a7-33790280c30c' },
  { name: 'DATASET - NEW ASSET', id: '0cf06b49-d33f-47f6-b241-e05d0747360f' },
  { name: 'DATASET - NEW ASSET', id: '8f45c58f-8504-49d9-8205-e9148329ce45' },
  {
    name: 'data_asset_7e3b5e27-c521-4356-b194-71e2c46e0d5e',
    id: 'ca417e37-6ab0-4353-afaf-c1efc518d8d4'
  },
  {
    name: 'data_asset_c78fffa8-f792-41d1-8ee0-09f1db93e259',
    id: '8dabe037-a309-4ee8-9689-115791e83943'
  },
  {
    name: 'data_asset_9dff4b3b-3805-4405-9b32-15b1bdc10371',
    id: '36f764cd-7596-4f47-ba2f-b6180605b3b9'
  },
  {
    name: 'data_asset_c80e3098-bef6-407d-806d-74caa3f1c2dc',
    id: 'a4ad5d3d-c859-4764-836e-aa25c2864b82'
  },
  {
    name: 'data_asset_fb977a2b-5fd3-4c41-8b9d-c0d587c4f35e',
    id: '5bd5f3cb-55d8-4bcb-b7f5-b93cb4bf3e8f'
  },
  {
    name: 'data_asset_2a38d811-a38b-478e-8a6f-9d690bca1747',
    id: '07e44468-0583-4519-bdc7-90e0a3c1b284'
  },
  { name: 'undefined', id: 'b221d75b-5859-403c-8b60-8ef6e5488dd9' },
  { name: 'undefined', id: 'ec71f186-7fcc-4e60-8038-ce1a5f340f6d' },
  { name: 'Tom123', id: 'e6bf0667-9c37-48c2-91c2-59e518565408' },
  { name: 'tom124', id: 'ffda1c03-c170-4aed-bfe7-d6e8cc4a0b73' },
  { name: 'NEW123', id: 'f738f808-349c-4184-a28f-666ea0414906' },
  { name: 'New1223', id: 'ee1d1146-8b2f-45b8-86c2-897805914385' },
  { name: 'Untitled Assetasmd;lamsd', id: '609cf84c-c8c8-45e2-b13a-0c200c899326' },
  { name: 'Untitled Asset123', id: '87f18399-15cf-4f80-9613-e122cce01a87' },
  { name: 'Asset123', id: 'c11e2027-54fb-4085-aada-9cef40af99dd' },
  { name: 'Untitled Asset=jk', id: '2e9c02d1-049e-4d81-9219-48866770357d' },
  { name: 'Untitled Asset', id: '50c0546b-0586-4da4-aed8-ec5473410da3' },
  { name: 'Untitled Asset', id: '2fa40fe5-fb67-4cb4-b0b1-a969813cb050' },
  { name: 'Untitled Asset', id: '4022c338-dd45-4952-90ca-5c7921face4b' },
  { name: 'Untitled Asset', id: 'c693547d-950d-479c-a20f-39e156a45d98' },
  { name: 'Untitled Assetsdasd', id: 'b6ca61b7-43b7-4c24-acdb-8a6bba293223' },
  { name: 'Untitled Asset', id: 'c13f9dd7-2912-4733-97be-dedd2beedc52' },
  { name: 'Untitled Asset', id: 'c6ca5b01-407b-41ca-8276-e5c60e065cf0' },
  { name: 'Untitled Asset', id: '44c9077a-0395-484c-9838-898161d7f3d6' },
  { name: 'Untitled Asset', id: '0a8b0c4a-fd4f-4540-9d69-7120ee69679d' },
  { name: 'Untitled Asset', id: 'b29d8a9a-7d4f-44e1-bf04-e9a3892e8d4b' },
  { name: 'Untitled Asset', id: '13bd6bdd-aaaa-4fca-8fab-ba6c968778d1' },
  { name: 'Untitled Asset', id: 'eb3f0375-cfdb-4285-9c59-931127a702c1' },
  { name: 'qw1', id: '84e086d2-fc15-4f15-bf00-9bc8e037e541' },
  { name: 'DATASET - null', id: 'b0dc48a8-9867-4140-aaca-42519dabd889' },
  { name: 'DATASET - null', id: 'c88f5e70-f343-4d77-ac0b-3f0507a65cdf' },
  { name: 'Untitled Asset', id: '7cce022f-c1ed-4eb3-8d9a-26462989182c' },
  { name: 'Asset1', id: '0acb79e0-83ea-4f8f-a28e-1e7302fcb1cc' },
  { name: 'Asset4', id: 'b211ed90-5bd0-4cab-b8ca-cb878d20228a' },
  { name: 'Asset$1', id: '19ddab75-11b7-4145-96d8-3f0f16dce004' },
  { name: 'tr', id: 'e3b86295-5c2f-4a72-9e73-e0ee60a55cc0' },
  { name: 'yu', id: 'ebf9d236-952d-47e6-9c0b-d28d265e3135' },
  { name: 'tyu', id: '7b6eb5ff-6ea7-4b6d-8e8e-c421d2bd755e' },
  { name: 'op', id: '5ee94059-df28-4258-86f7-d84eeefc1252' },
  { name: 'opum', id: '9cd6c20d-3252-401a-bf01-3fb8371801ef' },
  { name: 'po', id: 'b289ca4d-a785-42ac-90ca-34c577197ab7' },
  { name: 'point', id: 'b34b1117-89a1-45d6-85d3-86322bf44630' },
  { name: 'tp', id: '89b18bbf-89cb-4c30-b77a-334f7dcdb8ee' },
  { name: 'trup', id: 'fb4434f1-4589-4bca-9bda-f70f7401782e' },
  { name: 'fro', id: '265d4d9a-1ba4-4630-8623-68c447fd0e71' },
  { name: 'red', id: '7cc78447-cb4c-43a2-b966-1494e009cebf' },
  { name: 'pot', id: '953a10ed-aa0c-4ecb-80d6-838e5836d7fd' },
  { name: 'DATASET - null', id: '7c326de1-b9cd-4a92-ab83-a6520f1f695d' },
  { name: 'DATASET - null', id: '638acabb-2f46-44ab-b993-ee56ec34f455' },
  { name: 'DATASET - null', id: '27781841-8e4f-4e3f-8740-9e863044d887' },
  { name: 'DATASET - null', id: 'fdf6b369-9e83-4e04-af5e-2953f2585d39' },
  { name: 'DATASET - null', id: 'bd0dfa4b-fd24-481f-969c-bf9a3bdfd418' },
  { name: 'DATASET - null', id: 'ae637ba1-3a94-482a-b056-ac72f4d1d401' },
  { name: 'DATASET - DATASET - null', id: 'f68b4d05-6ab4-4b20-8cc4-5a5e691c9ae1' },
  { name: 'DATASET - pibfdj', id: 'e83ee21a-931a-4a58-877c-25746aab8df2' },
  { name: 'DATASET - ret32', id: 'ee2fd8f5-0b99-437e-98bf-68df1290461a' },
  { name: 'DATASET - tom43', id: '8ced8062-89a6-4bd1-9342-81ad8df658d1' },
  { name: 'DATASET - pom45', id: 'ea145f6a-0468-4602-b2ab-b05162b5913b' },
  { name: 'DATASET - rem', id: '7e4d67c3-1a3c-4986-a434-25ff1cbfa000' },
  { name: 'DATASET - remn', id: '2f718953-e9a3-485f-9179-54a2cc943e58' },
  { name: 'DATASET - yum', id: 'c911a25b-7c45-4530-88c2-9be99d7198df' },
  { name: 'DATASET - sdsdr', id: 'aa81e3d4-a677-46bb-85d0-585b5fd30cf0' },
  { name: 'DATASET - asdas', id: 'b4adb3b1-e84e-44b9-9876-8dc27f083b51' },
  { name: 'DATASET - rtm', id: 'd4d35634-dace-47e5-b1f5-b43f3d2124e4' },
  { name: 'DATASET - asdg', id: '9bc55933-aa27-4ac0-9d2c-ef3e8be19698' },
  { name: 'rtop', id: 'e41c9ef3-d947-4182-bc5c-8da73ad946ce' },
  { name: 'bon', id: '7c13ce38-69ff-4fd2-a482-22eb0ee87945' },
  { name: 'hymn', id: '70dbc7fa-cce8-4c37-956e-aac513457586' },
  { name: 'dfdfs', id: '707dc0dc-6662-4117-a435-0f7351c20438' },
  { name: 'dvds', id: 'ea3a3586-a445-4c3c-b4f0-ee5dd0744647' },
  { name: 'hghgv', id: '8b4c3d87-f4cd-4841-a250-3a65bde812ed' },
  { name: 'vcbvcbn', id: '8ff205a5-bd10-49a6-9f9d-350005409d2b' },
  { name: 'ASSET_FRIDAY1', id: '1cee2a70-b3cc-4299-8e01-00646b67461d' },
  { name: 'DATASET - SOMEWHERE', id: '728cc55f-fd9d-4058-9f93-9905078bd896' },
  { name: 'DATASET - kjhkh', id: '911e9c2d-1e65-47f5-a06f-021f8973d841' },
  { name: 'DATASET - bjbj', id: 'f1cd9aaa-e830-42cd-938a-8089a7bf7912' },
  { name: 'DATASET - sasf', id: '55452754-32e3-44ab-b5cf-b9b3bc488e88' },
  { name: 'DATASET - asas', id: 'a02cd63a-1cb9-4565-a06f-a6e29487a9af' },
  { name: 'DATASET - sd', id: 'c9c0170b-a796-4ee1-8934-ab6616b4ee4f' },
  { name: 'DATASET - WEDNESDAY_ASSET', id: '11cb86a3-5d45-436e-aabc-2cd4b186dd41' },
  { name: 'DATASET - WED_ASSET_1', id: 'beb1f12c-77ea-4bd7-918f-43f96c190102' },
  { name: 'DATASET - asdasd', id: 'dff48ff7-7b62-4d39-b280-e22e778a46e8' },
  { name: 'DATASET - asd09', id: '2868cd07-d610-4568-aa85-d1b14953768a' },
  { name: 'DATASET - asd98', id: 'ef88ff19-727a-4932-8712-7a46d1cb3352' },
  { name: 'DATASET - tyy1', id: 'd592e5f9-4363-438e-90ae-3d7115efe3ba' },
  { name: 'DATASET - asd43', id: '73a766ee-9a56-45cf-ab53-d9bfe134a516' },
  { name: 'DATASET - sdn1', id: '60efe975-38dc-42eb-957a-afd4594fcb57' },
  { name: 'DATASET - oio5', id: 'b0097893-0ded-47ed-b2ce-234556d55aa7' },
  { name: 'DATASET - jgjh', id: '7f5b18d6-a917-4d99-a274-3bd18b3cab74' },
  { name: 'DATASET - sd24', id: 'c59d5895-e163-4a96-8a15-852a7365079c' },
  { name: 'DATASET - 123123asd', id: 'd880ac1a-fffc-40af-8e3b-4e59d2aab0f9' },
  { name: 'DATASET - tyu1', id: '856db74e-8339-4bfd-8b3d-aebc6f40eb8f' },
  { name: 'DATASET - snfkn1', id: 'dee16bbd-d913-4821-8eb6-6ecb23f03ea6' },
  { name: 'DATASET - uywetr34', id: '11600cfb-5805-438a-8f56-c21e21fe0a33' },
  { name: 'DATASET - point21', id: 'e6b42239-faf6-4fe1-b231-638d28676c39' },
  { name: 'DATASET - asd', id: 'c1e206f7-4e0b-4490-8195-44e80f9dd1fa' },
  { name: 'DATASET - asd32', id: '05e5837b-b7b4-46b0-bc6f-8aa60fd7a859' },
  { name: 'DATASET - asdad132', id: '894eb0ce-b50c-45b0-b928-15140b63ab13' },
  { name: 'DATASET - sd231', id: '071b2f8a-da4e-44d4-9b34-4c84c8e46e69' },
  { name: 'DATASET - asd341', id: 'c4f66257-2a00-4dc9-9fb4-523c1f7c5ef9' },
  { name: 'DATASET - asd12#', id: 'd12c2aeb-97fa-4204-b0b9-89d5a60282fe' },
  { name: 'DATASET - 23sdv', id: '1277bd22-41b9-4708-b5b3-0eb88a39b334' },
  { name: 'DATASET - RETR12', id: 'a1c9f159-dcaa-4922-bf5e-04073c7199bc' },
  { name: 'DATASET - TOMMY1', id: 'bb5df271-5beb-42bd-8952-b5bd96beb5b1' },
  { name: 'DATASET - TOMMY2', id: 'fa6e5dbf-5d1f-4c1c-8f36-68dcbf849042' },
  { name: 'POINT-DATA', id: '1fed9a63-63a7-4e82-9824-1adb05501d78' },
  { name: 'point-data', id: '67e4b0f6-2ee1-436c-8d1e-3e16ca1636d6' },
  { name: 'po-data', id: '087173fb-7fb4-40c9-93af-2954eaa9e31c' },
  { name: 'oiyu-data', id: '4b077d49-1989-4777-9b39-c4be1b5a648f' },
  { name: 'pov', id: '9ab0bd9b-acca-4dab-b287-7c3fe1711601' },
  { name: 'moana-data', id: 'c9ceb3cb-75ad-4611-bff5-1639215d7e96' },
  { name: 'lk-data', id: '49acd40a-4b6d-4428-bcc7-2bf4d9cf4074' },
  { name: 'pl-data', id: 'd52c1564-e22d-47b6-9b73-2d46f4b9cc1e' },
  { name: 'plo-data', id: 'efce5fdb-1f73-4448-a9a5-a39886e9446d' },
  { name: 'asldalma;lsd', id: 'a7eeb42a-4c0e-4fa6-93c5-be7b3d4f02ef' },
  { name: 'RA-1-data', id: '6c102674-eac2-4db0-bd80-17c32b863006' },
  { name: 'RA-2-data', id: '145e1fd2-95b4-442e-bcc9-67bf08216ff5' },
  { name: 'RA-3-data', id: '4523ea2f-6115-4fdf-ae02-436d63ac4e8b' },
  { name: 'RA-6-data', id: '334f29ec-ad64-4f81-b818-cce52d58573d' },
  { name: 'test-data-1', id: 'ff6fe07b-9878-46b6-92a1-816a95320101' },
  { name: 'home-data', id: '58e4a2ff-1cf8-4a6e-a7af-60275b5a48dc' },
  { name: 'trw-data', id: 'b92c50d6-a566-4a7e-b1df-2bb3396107bd' },
  { name: 'ra-1-data', id: 'e7cb278c-a261-48f1-bc7a-420e5a915a6f' },
  { name: 'merge-data', id: '39aed581-e6fa-43d1-8b0e-1cd0e1425c46' },
  { name: 'DATASET - mnr', id: 'f5288a1c-6b2a-43bf-b200-9a6a50b172e4' },
  { name: 'rohru', id: '56918249-afe5-4196-a497-2b6a306fa080' },
  { name: 'DATASET - TUESDAY_ASSET_TEST 1', id: '6022bc0c-cd05-4ff4-b8b9-6e12b56a21c9' }
];

var storageKeys = {
  apiData: 'apiData'
};

self.onmessage = function(e) {
  console.info('worker:', e.data);
  const { type, data } = e.data;
  // self.postMessage(e.data);
  if (type === workerMessageTypes.API_DATA) {
    apiData = Object.assign({}, data);
  }
  if (type === workerMessageTypes.GET_DATASETS) {
    const newApiData = Object.assign({}, apiData);
    getDataAssets(apiData)
      .then(function(result) {
        var dataAssets = JSON.parse(result).accessibleDataAssetInformation;
        self.postMessage({ type: workerMessageTypes.GET_DATASETS, data: dataAssets });
      })
      .catch(function(err) {
        console.info('err:', err);
      });
  }
  if (type === workerMessageTypes.GET_DATASET_COLUMNNAMES) {
    const newApiData = Object.assign({}, apiData);
    newApiData.assetId = dataAssets.find(dataAsset => dataAsset.name === data).id;
    getColumnNamesOfAnAsset(newApiData)
      .then(function(result) {
        const columnNames = JSON.parse(result);
        self.postMessage({
          type: workerMessageTypes.GET_DATASET_COLUMNNAMES,
          data: {
            dataSetName: data,
            columnNames: columnNames
          }
        });
      })
      .catch(function(err) {
        console.info(err);
      });
  }
};
