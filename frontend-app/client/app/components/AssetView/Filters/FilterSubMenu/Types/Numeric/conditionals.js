import * as Criteria from '../../../Menus/criteria';

export const conditionals = [
  {
    text: 'Is',
    value: Criteria.EQUAL,
    slider: true,
    numberOfHandles: 1,
    rheostatBehaviour: 'is',
    active: false,
  },
  {
    text: 'Is not',
    value: Criteria.NOT_EQUAL,
    slider: true,
    numberOfHandles: 1,
    rheostatBehaviour: 'is',
    active: false,
  },
  {
    text: 'Is null',
    value: Criteria.IS_NULL,
    noInput: true,
    active: false,
  },
  {
    text: 'Is not null',
    value: Criteria.IS_NOT_NULL,
    noInput: true,
    active: false,
  },
  {
    text: 'Greater than',
    value: Criteria.GREATER_THAN,
    slider: true,
    numberOfHandles: 1,
    rheostatBehaviour: 'gt',
    active: false,
  },
  {
    text: 'Greater than or equal',
    value: Criteria.GREATER_THAN_EQUAL,
    slider: true,
    numberOfHandles: 1,
    rheostatBehaviour: 'gt',
    active: false,
  },
  {
    text: 'Less than',
    value: Criteria.LESS_THAN,
    slider: true,
    numberOfHandles: 1,
    active: false,
  },
  {
    text: 'Less than or equal',
    value: Criteria.LESS_THAN_EQUAL,
    slider: true,
    numberOfHandles: 1,
    active: false,
  },
  {
    text: 'Between',
    value: Criteria.BETWEEN,
    slider: true,
    numberOfHandles: 2,
    active: false,
  },
];

export default conditionals;
