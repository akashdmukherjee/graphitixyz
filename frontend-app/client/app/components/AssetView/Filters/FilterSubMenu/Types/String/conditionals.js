import * as Criteria from '../../../Menus/criteria';

export const conditionals = [
  {
    text: Criteria.Text.IS,
    value: Criteria.IS,
    selectables: true,
    active: false,
  },
  {
    text: Criteria.Text.IS_NOT,
    selectables: true,
    value: Criteria.IS_NOT,
    active: false,
  },
  {
    text: Criteria.Text.IS_NULL,
    value: Criteria.IS_NULL,
    active: false,
    noInput: true,
  },
  {
    text: Criteria.Text.IS_NOT_NULL,
    value: Criteria.IS_NOT_NULL,
    active: false,
    noInput: true,
  },
  {
    text: Criteria.Text.IS_EMPTY,
    value: Criteria.IS_EMPTY,
    active: false,
    noInput: true,
  },
  {
    text: Criteria.Text.IS_NOT_EMPTY,
    value: Criteria.IS_NOT_EMPTY,
    active: false,
    noInput: true,
  },
  {
    text: Criteria.Text.CONTAINS,
    value: Criteria.CONTAINS,
    numberOfInputs: 1,
    active: false,
  },
  {
    text: Criteria.Text.DOES_NOT_CONTAIN,
    value: Criteria.DOES_NOT_CONTAIN,
    numberOfInputs: 1,
    active: false,
  },
  {
    text: Criteria.Text.STARTS_WITH,
    value: Criteria.STARTS_WITH,
    numberOfInputs: 1,
    active: false,
  },
  {
    text: Criteria.Text.ENDS_WITH,
    value: Criteria.ENDS_WITH,
    numberOfInputs: 1,
    active: false,
  },
];

export default conditionals;
