export const colorCodes = [
  '#f26450',
  '#555E7B',
  '#B7D968',
  '#B576AD',
  '#E04644',
  '#FDE47F',
  '#7CCCE5',
  '#ED68A6',
  '#54AF16',
  '#0E838C',
  '#FC62F2',
  '#39F9C6',
  '#73D1D1',
  '#93F2A0',
  '#8FD159',
  '#F7EB13',
  '#051487',
  '#AE37DD',
  '#6382C6',
  '#F93163',
  '#C195ED',
];
// const colorCodesLength = colorCodes.length;
/*eslint-disable*/
export const getAssignedColorCodes = ({ color_uqkeys }) => {
  if (!color_uqkeys) return [];
  return color_uqkeys.map((color_uqkey, index) => ({
    color: colorCodes[index],
    value: color_uqkey.val
  }));
};

export default colorCodes;
