import * as SQLFunction from '../../../Menus/sqlFunction';
import { Types, DateConditionals } from '../Conditional';

const getDateFeatures = type => {
  const dateType = type.toLowerCase();
  let dateFeatures = [
    {
      text: 'Date',
      conditionalType: DateConditionals.TWO,
      slider: false,
      active: false,
    },
    {
      text: 'Year',
      value: Types.DATE === dateType
        ? SQLFunction.DATE_GET_YEAR
        : SQLFunction.TIMESTAMP_GET_YEAR,
      conditionalType: DateConditionals.ONE,
      sliderMinMaxValues: [1900, 2100],
      slider: true,
      active: false,
    },
    {
      text: 'Quarter',
      value: Types.DATE === dateType
        ? SQLFunction.DATE_GET_QUARTER
        : SQLFunction.TIMESTAMP_GET_QUARTER,
      conditionalType: DateConditionals.ONE,
      sliderMinMaxValues: [1, 4],
      slider: true,
      active: false,
    },
    {
      text: 'Month',
      value: Types.DATE === dateType
        ? SQLFunction.DATE_GET_MONTH
        : SQLFunction.TIMESTAMP_GET_MONTH,
      conditionalType: DateConditionals.ONE,
      slider: true,
      sliderMinMaxValues: [1, 12],
      active: false,
    },
    {
      text: 'Day',
      value: Types.DATE === dateType
        ? SQLFunction.DATE_GET_DAY
        : SQLFunction.TIMESTAMP_GET_DAY,
      conditionalType: DateConditionals.ONE,
      sliderMinMaxValues: [1, 31],
      slider: true,
      active: false,
    },
  ];

  if (Types.DATE === dateType) {
    dateFeatures = [...dateFeatures];
  } else {
    dateFeatures = [
      ...dateFeatures,
      {
        text: 'Hour',
        value: SQLFunction.TIMESTAMP_GET_HOUR,
        conditionalType: DateConditionals.ONE,
        slider: true,
        sliderMinMaxValues: [1, 24],
        active: false,
      },
      {
        text: 'Minute',
        value: SQLFunction.TIMESTAMP_GET_MIN,
        conditionalType: DateConditionals.ONE,
        slider: true,
        sliderMinMaxValues: [1, 60],
        active: false,
      },
      {
        text: 'Second',
        value: SQLFunction.TIMESTAMP_GET_SEC,
        conditionalType: DateConditionals.ONE,
        slider: true,
        sliderMinMaxValues: [1, 60],
        active: false,
      },
    ];
  }
  return dateFeatures;
};

export default getDateFeatures;
