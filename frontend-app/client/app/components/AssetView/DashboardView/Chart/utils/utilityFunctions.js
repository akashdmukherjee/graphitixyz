// search_datarecord_inDataset
// get_distinctVals_ofField_fromDataset
// isObjectEqual
// sort_dataset
// median
// deduplicate_dataset
// capitalizeFirstLetter
// parse_uqkey
// parse_uqkey_nometric
// addScaleUnits_onLargeNumbers
// getFontColor_forBackgroundRgb
export const search_datarecord_inDataset = function (dataset, field_name, field_val) {
  // This function is written assuming that:
  // There is only one matching record in the dataset for the given field value
  // This is best used for where the field being looked up has unique values in the dataset
  let matching_datarecord = -1; // Not Found

  dataset.map(function (datarecord) {
    if (datarecord[field_name] == field_val) matching_datarecord = datarecord;
  });

  return matching_datarecord;
};

export const get_distinctVals_ofField_fromDataset = function (dataset, field_name) {
  let unique = {};
  let distinct = [];
  let distinct_arrOfObjs = [];

  dataset.map(function (datarecord) {
    let field_val = datarecord[field_name];

    if (typeof unique[field_val] == 'undefined') distinct.push(field_val);
    if (typeof unique[field_val] == 'undefined') distinct_arrOfObjs.push(datarecord);

    unique[field_val] = field_val;
  });

  return {
    arr: distinct,
    arrOfObjs: distinct_arrOfObjs,
  };
};

export const isObjectEqual = function (a, b) {
  let prop;
  for (prop in a) {
    if (a[prop] !== b[prop]) return false;
  }
  for (prop in b) {
    if (b[prop] !== a[prop]) return false;
  }
  return true;
};

export const sort_dataset = function (dataset, sorting_field) {
  let sorted_dataset = dataset.sort(function (a, b) {
    return parseFloat(a[sorting_field]) - parseFloat(b[sorting_field]);
  });

  return sorted_dataset;
};

export const median = function (values) {
  values.sort(function (a, b) {
    return a - b;
  });
  var half = Math.floor(values.length / 2);

  if (values.length % 2) return values[half];
  else return (values[half - 1] + values[half]) / 2.0;
};

export const deduplicate_dataset = function (dataset) {
  let isAdded,
    arr = [];
  for (let i = 0; i < dataset.length; i++) {
    isAdded = arr.some(function (v) {
      return isObjectEqual(v, dataset[i]);
    });
    if (!isAdded) {
      arr.push(dataset[i]);
    }
  }
  return arr;
};

export const capitalizeFirstLetter = function (str) {
  str = str.replace(/_/g, ' ');

  let str_array = str.split(' ');
  let updated_str = '';

  for (let i = 0; i < str_array.length; i++) {
    let new_str_element = str_array[i].charAt(0).toUpperCase() + str_array[i].slice(1);
    updated_str = updated_str + ' ' + new_str_element;
  }

  return updated_str;
};

export const parse_uqkey = function (uqkey) {
  // UQKEY STRUCTURE:
  // groupers ~~~~ metric
  // grouper fields are separated by $$$$
  // only one metric appears in an UQKEY
  let metric_name = uqkey.substring(uqkey.indexOf('~~~~') + 4);

  let groupers = uqkey.split('~~~~');
  groupers.pop;
  groupers = groupers[0];
  groupers = groupers.split('$$$$');

  if (metric_name != '') {
    groupers.push(metric_name);
  }

  let labels = groupers.reverse();

  return labels;
};

export const parse_uqkey_nometric = function (uqkey) {
  // UQKEY STRUCTURE:
  // fields are separated by $$$$
  let fragment_vals = uqkey.split('~~~~');
  fragment_vals.pop;
  fragment_vals = fragment_vals[0];
  fragment_vals = fragment_vals.split('$$$$');

  return fragment_vals;
};

export const addScaleUnits_onLargeNumbers = function (number) {
  const one_billion = Math.pow(10, 9);
  const one_million = Math.pow(10, 6);
  const one_thousand = Math.pow(10, 3);

  if (number / one_billion >= 1) return number / one_billion + 'B';
  else if (number / one_million >= 1) return number / one_million + 'M';
  else if (number / one_thousand >= 1) return number / one_thousand + 'K';
  else return number;
};

export const hexToRGB = function (hex, alpha) {
  let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  } else {
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }
};

export const getFontColor_forBackgroundRgb = function (rgb) {
  let colors = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  let font_color;

  let r = parseInt(colors[1]);
  let g = parseInt(colors[2]);
  let b = parseInt(colors[3]);

  let total = Math.round((r * 299 + g * 587 + b * 114) / 1000);
  if (total > 140) font_color = '#3c3c3c';
  else font_color = '#fff';

  return font_color;
};
