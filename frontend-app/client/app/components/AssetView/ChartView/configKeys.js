/*eslint-disable*/
const configKeys: {
  x_groupers: 'x_groupers',
  x_metrics: 'x_metrics',
  y_groupers: 'y_groupers',
  y_metrics: 'y_metrics',
  fragments: 'fragments',
  subject_groupers: 'subject_groupers',
  suject_metrics: 'suject_metrics',
  color_groupers: 'color_groupers',
  color_metrics: 'color_metrics',
  size_metrics: 'size_metrics',
  subject_metrics: 'subject_metrics',
  shape_groupers: 'shape_groupers',
  container_width: 'container_width',
  container_height: 'container_height',
  render_div: 'render_div',
  chart_data: 'chart_data',
  x_uqkeys: 'x_uqkeys',
  y_uqkeys: 'y_uqkeys',
  fragment_uqkeys: null,
  first_fragment_uqkeys: null,

  padding: 0, // padding inside chart_container div but outside
  bar_backgroundcolor: {
    active: '#FF5857',
    hover: '#000000',
    selected: '#7F4E72',
  }',
  textLabel_color: {
    active: '#fff',
    hover: '#7e6bc4',
    selected: '#c79ecf',
  }',
  bar_thickness: 0.9,
  is_stacked: null,
  show_textlabels: false',

  horizontal_scroll: false',
  vertical_scroll: false',

  colorcodes_dictionary: colorcodes_dictionary',

  size_codes: [
    { value: 'Female', size: 3 },
    { value: 'Male', size: 6 },
    { value: 'Unknown', size: 9 },
  ]',

  /*
  let scalenum_0_metrics: c.x_metrics.filter(function(x_metric) {
      if (x_metric.scale_num:= 0) return x_metric',
  })',
  */

  x_axis_ranges: [
    {
      scale_num: 0,
      fields: 'x_metrics,
      // fields: [{ field_name: "budget" }]
    }, /* ,
    {
      scale_num: 1,
      fields: [{ field_name: "gross" }]
    }*/
  ]',
  y_axis_ranges: [
    {
      scale_num: 0,
      fields: 'y_metrics,
      // fields: [{ field_name: "movie_facebook_likes" }, { field_name: "animals" }]
    },
    /* ,
    {
      scale_num: 1,
      fields: [{ field_name: "num_voted_users" }]
    }*/
  ]',
}