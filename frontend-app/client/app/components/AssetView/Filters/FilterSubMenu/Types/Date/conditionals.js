import * as Criteria from '../../../Menus/criteria';

export const conditionals = {
  ONE: [
    {
      text: 'Is',
      numberOfMonths: 1,
      numberOfHandles: 1,
      value: Criteria.EQUAL,
    },
    {
      text: 'Is not',
      value: Criteria.NOT_EQUAL,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Is null',
      value: Criteria.IS_NULL,
      noInput: true,
    },
    {
      text: 'Is not null',
      value: Criteria.IS_NOT_NULL,
      noInput: true,
    },
    {
      text: 'Less than',
      value: Criteria.LESS_THAN,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Less than or equal',
      value: Criteria.LESS_THAN_EQUAL,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Greater than',
      value: Criteria.GREATER_THAN,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Greater than or equal',
      value: Criteria.GREATER_THAN_EQUAL,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
  ],
  TWO: [
    {
      text: 'Is',
      value: Criteria.EQUAL,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Is not',
      value: Criteria.NOT_EQUAL,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Is null',
      value: Criteria.IS_NULL,
      noInput: true,
    },
    {
      text: 'Is not null',
      value: Criteria.IS_NOT_NULL,
      noInput: true,
    },
    {
      text: 'Less than',
      value: Criteria.LESS_THAN,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Less than or equal',
      value: Criteria.LESS_THAN_EQUAL,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Greater than',
      value: Criteria.GREATER_THAN,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Greater than or equal',
      value: Criteria.GREATER_THAN_EQUAL,
      numberOfMonths: 1,
      numberOfHandles: 1,
    },
    {
      text: 'Between',
      value: Criteria.BETWEEN,
      numberOfMonths: 2,
      numberOfHandles: 1,
    },
  ],
};

export default conditionals;
