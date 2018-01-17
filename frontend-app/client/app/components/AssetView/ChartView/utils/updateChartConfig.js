const updateChartConfig = function (vizData, v, colorcodes_dictionary, is_stacked) {
  let chartConfig = {};
  // console.info('is_stacked', is_stacked);

  chartConfig.x_groupers = v.x_groupers;
  chartConfig.x_metrics = v.x_metrics;
  chartConfig.y_groupers = v.y_groupers;
  chartConfig.y_metrics = v.y_metrics;
  chartConfig.fragments = v.fragments;
  chartConfig.subject_groupers = v.subject_groupers;
  chartConfig.suject_metrics = v.suject_metrics;
  chartConfig.color_groupers = v.color_groupers;
  chartConfig.color_metrics = v.color_metrics;
  chartConfig.size_metrics = v.size_metrics;
  chartConfig.angle_metrics = v.angle_metrics;
  chartConfig.subject_metrics = v.subject_metrics;
  chartConfig.shape_groupers = v.shape_groupers;

  chartConfig.container_width = get_chartContainerDimensions()[0];
  chartConfig.container_height = get_chartContainerDimensions()[1];
  chartConfig.render_div = 'chart_container';

  chartConfig.chart_data = vizData.data;
  chartConfig.x_uqkeys = vizData.x_uqkeys;
  chartConfig.y_uqkeys = vizData.y_uqkeys;
  chartConfig.fragment_uqkeys = vizData.fragment_uqkeys;
  chartConfig.first_fragment_uqkeys = vizData.first_fragment_uqkeys;

  chartConfig.padding = 0; // padding inside chart_container div but outside
  chartConfig.bar_backgroundcolor = {
    active: '#FF5857',
    hover: '#000000',
    selected: '#7F4E72',
  };
  chartConfig.textLabel_color = {
    active: '#fff',
    hover: '#7e6bc4',
    selected: '#c79ecf',
  };
  chartConfig.bar_thickness = window.bar_thickness;
  chartConfig.hole_size = window.hole_size;
  chartConfig.is_stacked = is_stacked;
  chartConfig.show_textlabels = false;

  // chartConfig.horizontal_scroll = $('#horizontal_scroll :selected').val();
  // chartConfig.vertical_scroll = $('#vertical_scroll :selected').val();
  chartConfig.horizontal_scroll = window.horizontal_scroll;
  chartConfig.vertical_scroll = window.vertical_scroll;

  chartConfig.colorcodes_dictionary = colorcodes_dictionary;

  chartConfig.size_codes = [
    { value: 'Female', size: 3 },
    { value: 'Male', size: 6 },
    { value: 'Unknown', size: 9 },
  ];

  /*
  let scalenum_0_metrics = c.x_metrics.filter(function(x_metric) {
      if (x_metric.scale_num == 0) return x_metric;
  });
  */

  chartConfig.x_axis_ranges = [
    {
      scale_num: 0,
      fields: v.x_metrics,
      // fields: [{ field_name: "budget" }]
    }, /* ,
    {
      scale_num: 1,
      fields: [{ field_name: "gross" }]
    }*/
  ];
  chartConfig.y_axis_ranges = [
    {
      scale_num: 0,
      fields: v.y_metrics,
      // fields: [{ field_name: "movie_facebook_likes" }, { field_name: "animals" }]
    },
    /* ,
    {
      scale_num: 1,
      fields: [{ field_name: "num_voted_users" }]
    }*/
  ];

  return chartConfig;
};

export default updateChartConfig;
