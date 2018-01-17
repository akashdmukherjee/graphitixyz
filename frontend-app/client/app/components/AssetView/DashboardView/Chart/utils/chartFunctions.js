import d3 from 'd3';
import {
  search_datarecord_inDataset,
  get_distinctVals_ofField_fromDataset,
  isObjectEqual,
  sort_dataset,
  median,
  deduplicate_dataset,
  capitalizeFirstLetter,
  parse_uqkey,
  parse_uqkey_nometric,
  addScaleUnits_onLargeNumbers,
  getFontColor_forBackgroundRgb,
  hexToRGB,
} from './utilityFunctions';

export const calculateChartArea = function () {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
  } = this;
  const chart_area = {
    width: 0,
    height: 0,
  };

  let width;
  if (horizontal_scroll == 'scroll') {
    chart_area['width_group'] = 80;
    chart_area['width'] = chart_area['width_group'] * x_uqkeys.length;
    width = chart_area['width'] + space_for_axes.left + space_for_axes.right + 2 * padding;
  } else {
    width = container_width;

    chart_area['width'] = width - space_for_axes.left - space_for_axes.right - 2 * padding;

    chart_area['width_group'] = chart_area['width'] / x_uqkeys.length;
  }

  let height;
  if (vertical_scroll == 'scroll') {
    chart_area['height_group'] = 80;
    chart_area['height'] = chart_area['height_group'] * y_uqkeys.length;
    height = chart_area['height'] + space_for_axes.top + space_for_axes.bottom + 2 * padding;
  } else {
    height = container_height;

    chart_area['height'] = height - space_for_axes.top - space_for_axes.bottom - 2 * padding;

    chart_area['height_group'] = chart_area['height'] / y_uqkeys.length;
  }

  chart_area.space_for_axes = space_for_axes;

  return chart_area;
};

export const createScales = function (
  x_axis_ranges,
  y_axis_ranges,
  value_size_min,
  value_size_max,
  chartConfigs
) {
    console.info(this)
  // HORIZONTAL LINEAR scale
  let xScales = [];
  const {
    chart_area,
    chart_data,
  } = this;
  x_axis_ranges.map(function (x_axis_range, x_axis_range_index) {
    let filtered_data = chart_data.filter(function (datarecord) {
      for (let i = 0; i < x_axis_range.fields.length; i++) {
        if (datarecord.x_metric == x_axis_range.fields[i].field_name) return datarecord;
      }
    });

    const max_d = Math.max.apply(
      Math,
      filtered_data.map(function (datarecord) {
        return datarecord.x_intercept;
      })
    );

    const min_d = Math.min.apply(
      Math,
      filtered_data.map(function (datarecord) {
        return datarecord.x_intercept;
      })
    );

    let scale_min = 0; // or min_d
    let scale = d3.scale
      .linear()
      .range([0, chart_area['width_group']])
      .domain([scale_min, max_d * 1.1]);
    // .domain([0, max_d * 1.1])
    // .nice()
    // necessary to keep some extra unused space on linear axis so that the height with the maximum bar does not touch the roof of the height group

    xScales.push(scale);
  });

  // VERTICAL LINEAR scale
  let yScales = [];
  y_axis_ranges.map(function (y_axis_range, y_axis_range_index) {
    let filtered_data = chart_data.filter(function (datarecord) {
      for (let i = 0; i < y_axis_range.fields.length; i++) {
        if (datarecord.y_metric == y_axis_range.fields[i].field_name) return datarecord;
      }
    });

    const max_d = Math.max.apply(
      Math,
      filtered_data.map(function (datarecord) {
        return datarecord.y_intercept;
      })
    );

    const min_d = Math.min.apply(
      Math,
      filtered_data.map(function (datarecord) {
        return datarecord.y_intercept;
      })
    );
    let scale_min = 0; // or min_d
    let scale = d3.scale
      .linear()
      .range([chart_area['height_group'], 0])
      .domain([scale_min, max_d * 1.1]);
    // .domain([0, max_d * 1.1])
    // .nice()
    // necessary to keep some extra unused space on linear axis so that the height with the maximum bar does not touch the roof of the height group

    yScales.push(scale);
  });

  // ==============================================================================
  // SIZE LINEAR scale
  let filtered_data = chart_data;

  const max_size_d = Math.max.apply(
    Math,
    filtered_data.map(function (datarecord) {
      return datarecord.size_metric_val;
    })
  );

  const min_size_d = Math.min.apply(
    Math,
    filtered_data.map(function (datarecord) {
      return datarecord.size_metric_val;
    })
  );

  let scale_size_min = 0; // or min_size_d
  let scale_size_max = max_size_d;

  let sizeScale = d3.scale
    .linear()
    .range([value_size_min, value_size_max])
    .domain([scale_size_min, scale_size_max]);
  // .domain([0, scale_size_max * 1.1])

  // ==============================================================================

  // ==============================================================================
  // COLOR LINEAR scale
  let colorScale = d3.scale.linear();
  const max_color_d = Math.max.apply(
    Math,
    filtered_data.map(function (datarecord) {
      return datarecord.color_metric_val;
    })
  );

  const min_color_d = Math.min.apply(
    Math,
    filtered_data.map(function (datarecord) {
      return datarecord.color_metric_val;
    })
  );

  let scale_color_min = min_color_d; // or 0
  let scale_color_max = max_color_d;

  // Calculate Color Middle Point
  let scale_color_middle = 0;
  // =====  Middle Point: Average
  scale_color_middle = (scale_color_min + scale_color_max) / 2;

  // =====  Middle Point: Median
  let color_metric_val__values = filtered_data.map(function (datarecord) {
    return parseFloat(datarecord.color_metric_val);
  });
  scale_color_middle = median(color_metric_val__values);

  // ChromaJS 3-level Diverging: #8b0000, #ffffe0, #008080
  let value_color_min = '#8b0000'; // bring from chartConfig
  let value_color_middle = '#ccc'; // bring from chartConfig
  let value_color_max = '#008080'; // bring from chartConfig

  colorScale
    // .range(['red', 'green', 'blue']) //for multi-scale
    // .domain([0, pivot, max]) //for multi-scale
    .range([value_color_min, value_color_middle, value_color_max])
    .domain([scale_color_min, scale_color_middle, scale_color_max]);
  // ==============================================================================

  return {
    yScales,
    xScales,
    sizeScale,
    colorScale,
  };
};

export const drawSvgContainer = function (chartContainerId) {
  return d3.select('#' + chartContainerId).append('svg').attr('class', 'svg_'+chartContainerId).attr('height', 10).attr('width', 10);
};

export const sizeAndPositionSvgContainer = function () {
  const {
    svg,
    space_for_axes,
    chart_area,
  } = this;

  svg
    .attr('height', chart_area['height'] + space_for_axes.top + space_for_axes.bottom)
    .attr('width', chart_area['width'] + space_for_axes.left + space_for_axes.right);
};

export const getLabels_fromUqkeys = function (uqkeys) {
  let _labels = [];
  let num_levels = 0;
  uqkeys.map(function (uqkey) {
    let labels = parse_uqkey_nometric(uqkey.val); // array
    num_levels = labels.length;

    // converting array to array of objects -- to include level
    labels.map(function (label, label_index) {
      let _label = {
        val: label,
        level: num_levels - label_index,
      };
      _labels.push(_label);
    });
  });

  // adding offset and occurrences to _labels
  _labels.map(function (_label, _label_index) {
    _label.offset = 0;
    _label.occurrences = 0;
    for (let i = 0; i < _label_index; i++) {
      if (_label.level == _labels[i].level) {
        _label.offset++;
      }
    }

    for (let i = _label_index; i < _labels.length; i++) {
      if (_label.level == _labels[i].level && _label.val == _labels[i].val) {
        _label.occurrences++;
      } else if (_label.level == _labels[i].level && _label.val != _labels[i].val) {
        break;
      }
    }
  });

  // adding is_visible to _labels
  _labels.map(function (label, label_index) {
    label.is_visible = 1;
    for (let i = 0; i < label_index; i++) {
      let condition = true;
      for (let l = 1; l <= label.level; l++) {
        condition = condition && _labels[label_index + (l - 1)].val == _labels[i + (l - 1)].val;
      }

      if (condition) label.is_visible = 0;
    }
  });

  return _labels;
};

export const createXAxesLabels = function (svg) {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    thickness_multiplier,
    chart_area,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    x_groupers,
    y_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  //= ==== HORIZONTAL: FRAGMENT/METRIC LABELS
  if (is_metrics_x) {
    space_for_axes.bottom += 50;
  }

  if (is_metrics_y) {
    space_for_axes.left += 30;
  }

  if (
    (is_metrics_nox_y && is_fragments) ||
    (is_metrics_nox_noy && !is_metrics_angle && is_fragments)
  ) {
    let maxWidth_of_textLabel = 0;
    x_uqkeys.map(function (x_uqkey, x_uqkey_index) {
      svg
        .append('g')
        .attr('class', 'x_axis_first_labels')
        .selectAll('.x_axis_first_labels')
        .data(first_fragment_uqkeys)
        .enter()
        .append('text')
        .attr('class', 'x_axis_first_label')
        .attr('x', 10)
        .attr('y', 10)
        .attr('dy', '.75em')
        .text(function (fragment_uqkey, fragment_uqkey_index) {
          return fragment_uqkey.val;
        })
        .attr('font-family', x_axis_first_label_font_family)
        .attr('font-size', x_axis_first_label_font_size)
        .attr('fill', x_axis_first_label_font_color)
        .attr('opacity', 1)
        .attr('text-anchor', 'right')
        .attr('alignment-baseline', 'baseline')
        .attr('font-weight', '400')
        .attr('transform', function (fragment_uqkey, fragment_uqkey_index) {
          return 'rotate(-90)';
        });
    });

    let axislabels = d3.selectAll('.x_axis_first_label')[0];
    axislabels.map(function (textElement) {
      let bbox = textElement.getBBox();
      var width = bbox.width;
      var height = bbox.height;
      maxWidth_of_textLabel = Math.max(maxWidth_of_textLabel, width);
    });

    space_for_axes.bottom += 10 + maxWidth_of_textLabel;
  }

  //= ==== HORIZONTAL: GROUPER LABELS
  if (is_groupers_x) {
    let x_labels = this.getLabels_fromUqkeys(x_uqkeys);

    svg
      .append('g')
      .attr('class', 'x_axis_grouper_labels')
      .selectAll('.x_axis_grouper_labels')
      .data(x_labels)
      .enter()
      .append('text')
      .attr('class', function (label, label_index) {
        if (label.is_visible == 0) {
          return 'x_axis_grouper_label hidden';
        } else {
          return 'x_axis_grouper_label';
        }
      })
      .attr('dy', '.75em')
      .text(function (label, label_index) {
        return capitalizeFirstLetter(label.val);
      })
      .attr('font-family', x_axis_grouper_label_font_family)
      .attr('fill', x_axis_grouper_label_font_color)
      .attr('font-size', x_axis_grouper_label_font_size)
      .attr('opacity', 1)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'baseline')
      .attr('font-weight', '400');

    space_for_axes.bottom += 30 * x_groupers.length;
  }
};

export const positionXAxesLabels = function () {
  const {
    space_for_axes,
    x_uqkeys,
    first_fragment_uqkeys,
    chart_area
  } = this;
  x_uqkeys.map(function (x_uqkey, x_uqkey_index) {
    d3
      .selectAll('.x_axis_first_label')
      .attr('x', function (fragment_uqkey, fragment_uqkey_index) {
        let textWidth = this.getBBox().width;
        return -1 * (chart_area['height'] + textWidth + 10);
      })
      .attr('y', function (fragment_uqkey, fragment_uqkey_index) {
        let n = first_fragment_uqkeys.length;
        let y_pos =
          // chart_area["width_group"] * x_uqkey_index +
          space_for_axes.left +
          chart_area['width_group'] * (fragment_uqkey_index + 1) / n -
          chart_area['width_group'] / n / 2;

        return y_pos;
      });
  });

  d3.selectAll('.x_axis_grouper_label.hidden').remove();

  d3
    .selectAll('.x_axis_grouper_label')
    .attr('x', function (d, i) {
      return chart_area['width_group'] * d.offset + chart_area['width_group'] * d.occurrences / 2;
    })
    .attr('y', function (d, i) {
      return chart_area['height'] + space_for_axes.bottom + 10 - 30 * d.level;
    });
};

export const createYAxesLabels = function (svg) {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    thickness_multiplier,
    chart_area,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  //= ==== VERTICAL: FRAGMENT/METRIC LABELS

  if (is_metrics_x_noy && is_fragments) {
    let maxWidth_of_textLabel = 0;
    y_uqkeys.map(function (y_uqkey, y_uqkey_index) {
      svg
        .append('g')
        .attr('class', 'y_axis_first_labels')
        .selectAll('.y_axis_first_labels')
        .data(first_fragment_uqkeys)
        .enter()
        .append('text')
        .attr('class', 'y_axis_first_label')
        .attr('x', 10)
        .attr('y', 10)
        .attr('dy', '.75em')
        .text(function (fragment_uqkey, fragment_uqkey_index) {
          return fragment_uqkey.val;
        })
        .attr('font-family', y_axis_first_label_font_family)
        .attr('font-size', y_axis_first_label_font_size)
        .attr('fill', y_axis_first_label_font_color)
        .attr('opacity', 1)
        .style('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .attr('font-weight', '400');
    });

    let axislabels = d3.selectAll('.y_axis_first_label')[0];
    axislabels.map(function (textElement) {
      let bbox = textElement.getBBox();
      var width = bbox.width;
      var height = bbox.height;
      maxWidth_of_textLabel = Math.max(maxWidth_of_textLabel, width);
    });

    space_for_axes.left += 10 + maxWidth_of_textLabel;
  }

  //= ==== VERTICAL: GROUPER LABELS
  if (is_groupers_y) {
    let y_labels = this.getLabels_fromUqkeys(y_uqkeys);

    svg
      .append('g')
      .attr('class', 'y_axis_grouper_labels')
      .selectAll('.y_axis_grouper_labels')
      .data(y_labels)
      .enter()
      .append('text')
      .attr('class', function (label, label_index) {
        if (label.is_visible == 0) {
          return 'y_axis_grouper_label hidden';
        } else {
          return 'y_axis_grouper_label';
        }
      })
      .attr('dy', '.75em')
      .text(function (label, label_index) {
        return capitalizeFirstLetter(label.val);
      })
      .attr('transform', function (label, label_index) {
        // if (label_index == 0) {
        // return "rotate(-90)";
        // } else {
        return 'rotate(0)';
        // }
      })
      .attr('font-family', y_axis_grouper_label_font_family)
      .attr('fill', y_axis_grouper_label_font_color)
      .attr('font-size', y_axis_grouper_label_font_size)
      .attr('opacity', 1)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .attr('font-weight', '400');

    space_for_axes.left += 10 + 60 * y_groupers.length;
  }
};

export const positionYAxesLabels = function () {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    thickness_multiplier,
    svg,
    chart_area,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  // REFER X LABELS
  y_uqkeys.map(function (y_uqkey, y_uqkey_index) {
    d3
      .selectAll('.y_axis_first_label')
      .attr('x', function (fragment_uqkey, fragment_uqkey_index) {
        let textWidth = this.getBBox().width;
        return space_for_axes.left - 10;

        // return 0;
      })
      .attr('y', function (fragment_uqkey, fragment_uqkey_index) {
        let n = first_fragment_uqkeys.length;
        let pos =
          // chart_area["height_group"] * y_uqkey_index +
          chart_area['height_group'] * (fragment_uqkey_index + 1) / n -
          chart_area['height_group'] / n / 2;

        return pos;
      });
  });
  // REFER X LABELS

  d3.selectAll('.y_axis_grouper_label.hidden').remove();

  let __selection = d3.selectAll('.y_axis_grouper_label');
  __selection
    .attr('x', function (d, i) {
      let x_pos = 0;
      if (is_metrics_nox_noy || is_metrics_x_noy) {
        // MATRIX CHART or HORIZONTAL BARS
        x_pos = 60 * (1 + d.level) - space_for_axes.left + 10;
      } else {
        // VERTICAL BARS or SCATTER CHART
        x_pos = space_for_axes.left - 60 - 60 * d.level;
      }

      return x_pos;
    })
    .attr('y', function (d, i) {
      return chart_area['height_group'] * d.offset + chart_area['height_group'] * d.occurrences / 2;
    });
};

export const createAxesGridlines = function (svg) {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    thickness_multiplier,
    chart_area,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  let num_ticks_x = 5; // TODO: Make this dynamic
  let num_ticks_y = 5; // TODO: Make this dynamic
  // drawing HORIZONTAL gridlines
  y_uqkeys.map(function (y_uqkey, y_uqkey_index) {
    let scalenum_for_this_axis = y_uqkey.scale_num;
    let x_gridlines = yScales[scalenum_for_this_axis].ticks(num_ticks_y);
    x_gridlines.map(function (x_gridline) {
      svg
        .append('line')
        .attr('class', 'horizontal-gridline-lite')
        .style('stroke', '#eeeeee')
        .style('stroke-width', '1.2px')
        .style('shape-rendering', 'optimizeQuality')
        .attr('x1', space_for_axes.left)
        .attr(
          'y1',
          yScales[scalenum_for_this_axis](x_gridline) + chart_area['height_group'] * y_uqkey_index
        )
        .attr('x2', space_for_axes.left + chart_area['width'])
        .attr(
          'y2',
          yScales[scalenum_for_this_axis](x_gridline) + chart_area['height_group'] * y_uqkey_index
        );
    });
  });
  svg
    .append('line') // horizontal topmost line on svg chart top
    .attr('class', 'horizontal-outline-top')
    .style('stroke', '#cccccc')
    .style('stroke-width', '1.2px')
    .style('shape-rendering', 'optimizeQuality')
    .attr('x1', space_for_axes.left)
    .attr('y1', 1)
    .attr('x2', space_for_axes.left + chart_area['width'])
    .attr('y2', 1);

  // drawing VERTICAL gridlines
  x_uqkeys.map(function (x_uqkey, x_uqkey_index) {
    let scalenum_for_this_axis = x_uqkey.scale_num;
    let y_gridlines = xScales[scalenum_for_this_axis].ticks(num_ticks_x);
    y_gridlines.map(function (y_gridline) {
      svg
        .append('line')
        .attr('class', 'vertical-gridline-lite')
        .style('stroke', '#eeeeee')
        .style('stroke-width', '1.2px')
        .style('shape-rendering', 'optimizeQuality')
        .attr(
          'x1',
          space_for_axes.left +
            xScales[scalenum_for_this_axis](y_gridline) +
            chart_area['width_group'] * x_uqkey_index
        )
        .attr('y1', 0)
        .attr(
          'x2',
          space_for_axes.left +
            xScales[scalenum_for_this_axis](y_gridline) +
            chart_area['width_group'] * x_uqkey_index
        )
        .attr('y2', chart_area['height']);
    });
  });
  svg
    .append('line') // horizontal topmost line on svg chart top
    .attr('class', 'vertical-outline-right')
    .style('stroke', '#cccccc')
    .style('stroke-width', '1.2px')
    .style('shape-rendering', 'optimizeQuality')
    .attr('x1', space_for_axes.left + chart_area['width'] - 1)
    .attr('y1', 0)
    .attr('x2', space_for_axes.left + chart_area['width'] - 1)
    .attr('y2', chart_area['height']);

  // drawing VERTICAL axes
  y_uqkeys.map(function (y_uqkey, y_uqkey_index) {
    let scalenum_for_this_axis = y_uqkey.scale_num;
    let yAxis = d3.svg
      .axis()
      .scale(yScales[scalenum_for_this_axis])
      .orient('left')
      .ticks(num_ticks_y)
      .tickSize(0)
      .tickPadding(8)
      // we use Tickformat to round our high numbers accordingly
      // we use Tickformat to round our high numbers accordingly
      .tickFormat(function (d) {
        return addScaleUnits_onLargeNumbers(d);
      });
    svg
      .append('g')
      .attr(
        'transform',
        'translate(' + space_for_axes.left + ',' + chart_area['height_group'] * y_uqkey_index + ')'
      )
      .attr('class', 'y axis')
      .call(yAxis);
  });

  // drawing dummy VERTICAL axes
  x_uqkeys.map(function (x_uqkey, x_uqkey_index) {
    svg
      .append('line')
      .attr('class', 'vertical-outline-middle')
      .style('stroke', '#cccccc')
      .style('stroke-width', '1.2px')
      .style('shape-rendering', 'optimizeQuality')
      .attr('x1', space_for_axes.left + chart_area['width_group'] * (x_uqkey_index + 1))
      .attr('y1', 0)
      .attr('x2', space_for_axes.left + chart_area['width_group'] * (x_uqkey_index + 1))
      .attr('y2', chart_area['height'] + space_for_axes.bottom - 10 - 30 * 1); // TODO: Make dynamic: 30 * 1 should be 30 * level
  });

  // drawing HORIZONTAL axes
  x_uqkeys.map(function (x_uqkey, x_uqkey_index) {
    let scalenum_for_this_axis = x_uqkey.scale_num;
    let __x = space_for_axes.left + chart_area['width_group'] * x_uqkey_index;

    let xAxis = d3.svg
      .axis()
      .scale(xScales[scalenum_for_this_axis])
      .orient('bottom')
      .ticks(num_ticks_x)
      .tickSize(0)
      .tickPadding(8)
      // we use Tickformat to round our high numbers accordingly
      .tickFormat(function (d) {
        return addScaleUnits_onLargeNumbers(d);
      })
      .outerTickSize(0);
    svg
      .append('g')
      .attr('transform', 'translate(' + __x + ',' + chart_area['height'] + ')')
      .attr('class', 'x axis')
      .call(xAxis);
  });

  // drawing dummy HORIZONTAL axes
  y_uqkeys.map(function (y_uqkey, y_uqkey_index) {
    svg
      .append('line')
      .attr('class', 'horizontal-outline-middle')
      .style('stroke', '#cccccc')
      .style('stroke-width', '1.2px')
      .style('shape-rendering', 'optimizeQuality')
      .attr('x1', space_for_axes.left) // padding here?
      .attr('y1', chart_area['height_group'] * (y_uqkey_index + 1))
      .attr('x2', space_for_axes.left + chart_area['width'])
      .attr('y2', chart_area['height_group'] * (y_uqkey_index + 1));
  });

  // REMOVE TICK from all axes -- that have label as 0
  svg
    .selectAll('.tick')
    .filter(function (d) {
      return d === 0;
    })
    .remove();
};

export const x_calc1 = function (datarecord, chart_area, xScales) {
  let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
  let w = chart_area['width_group'] / n;

  let calc1 =
    xScales[datarecord.x_uqkey_scale_num](datarecord.x_intercept) +
    chart_area['width_group'] * (datarecord.x_uqkey_index - 1);

  return calc1;
};

export const x_calc2 = function (datarecord) {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    thickness_multiplier,
    svg,
    chart_area,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
  let w = chart_area['width_group'] / n;

  let calc2 =
    (datarecord.fragment_uqkey_index - 1) * w +
    w / 2 +
    chart_area['width_group'] * (datarecord.x_uqkey_index - 1);

  return calc2;
};

export const y_calc1 = function (datarecord, chart_area, yScales) {
  let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
  let h = chart_area['height_group'] / n;

  let calc1 =
    yScales[datarecord.y_uqkey_scale_num](datarecord.y_intercept) +
    chart_area['height_group'] * (datarecord.y_uqkey_index - 1);

  return calc1;
};

export const y_calc2 = function (datarecord, chart_area, yScales) {
  let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
  let h = chart_area['height_group'] / n;

  let calc2 =
    (datarecord.fragment_uqkey_index - 1) * h +
    h / 2 +
    chart_area['height_group'] * (datarecord.y_uqkey_index - 1);

  return calc2;
};

export const y_calc3 = function (datarecord, chart_area, yScales) {
  let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
  let h = chart_area['height_group'] / n;

  let calc3 = (datarecord.fragment_uqkey_index - 1) * h;

  return calc3;
};

export const getBarThickness = function (datarecord, thickness_multiplier) {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    svg,
    chart_area,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
  let w = chart_area['width_group'] / n;
  let h = chart_area['height_group'] / n;

  let thickness = 0;
  let margin = 0.05;

  if (is_metrics_nox_y) {
    thickness = w * (1 - margin);
  } else if (is_metrics_x_noy) {
    thickness = h * (1 - margin);
  } else if (is_metrics_x_y) {
    thickness = 0;
  } else if (is_metrics_nox_noy) {
    thickness = w;
  }

  thickness = thickness * thickness_multiplier;

  return thickness;
};

export const getBackgroundColor = function (datarecord) {
  const colorcodes_dictionary = this.colorcodes_dictionary;
  for (let i = 0; i < colorcodes_dictionary.length; i++) {
    if (datarecord.color_uqkey == colorcodes_dictionary[i]['value']) {
      return colorcodes_dictionary[i]['color'];
    }
  }
  return '#3c3c3c';
};

export const createInteractions = function () {
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_groupers,
    y_groupers,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    thickness_multiplier,
    svg,
    chart_area,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  const self = this;

  let datapoints = d3.selectAll('.datapoint');

  datapoints.on('mouseover', function (d) {
    const selectedDatapoint = d3.select(this);
    const hover_coords = d3.mouse(this);

    let __x = 'x';
    if (is_metrics_x_y) __x = 'cx';
    let __y = 'y';
    if (is_metrics_x_y) __y = 'cy';

    let bar_thickness = self.getBarThickness(d, thickness_multiplier);
    let screen_x = d3.event.pageX;
    let datapoint_x;
    let datapoint_y;

    if (is_metrics_nox_noy && is_metrics_angle) {
      // DRAW PIE CHART
      let t = d3.transform(d3.select(this).attr('transform'));
      datapoint_x = t.translate[0];
      datapoint_y = t.translate[1];

      d = d.data;
    } else {
      datapoint_x = selectedDatapoint[0][0][__x]['baseVal']['value']; // will be different for rect/circle
      datapoint_y = selectedDatapoint[0][0][__y]['baseVal']['value']; // will be different for rect/circle
    }

    let mouse_x = hover_coords[0];
    let screen_y = d3.event.pageY;
    let mouse_y = hover_coords[1];

    let datapoint_height = 0;
    if ((is_metrics_nox_noy && !is_metrics_angle) || is_metrics_nox_y || is_metrics_x_noy) {
      datapoint_height = selectedDatapoint[0][0]['height']['baseVal']['value'];
    }

    let tooltip_x_pos;

    let tooltip_y_pos;

    if (is_metrics_nox_y) {
      // VERTICAL BARS
      tooltip_x_pos = screen_x - (mouse_x - datapoint_x) + bar_thickness / 2;
      // tooltip_y_pos = screen_y - (mouse_y - datapoint_y) + datapoint_height / 2;
      tooltip_y_pos = screen_y - 10;
    } else if (is_metrics_x_noy) {
      // HORIZONTAL BARS
      tooltip_x_pos = screen_x + 25;
      // tooltip_y_pos = screen_y - (mouse_y - datapoint_y) - bar_thickness / 2;
      tooltip_y_pos = screen_y - 10;
    } else if (is_metrics_x_y) {
      // SCATTER CHART
      tooltip_x_pos = screen_x + 25;
      // tooltip_y_pos = screen_y - 40;
      tooltip_y_pos = screen_y - 10;
    } else if (is_metrics_nox_noy && !is_metrics_angle) {
      // MATRIX CHART
      tooltip_x_pos = screen_x - (mouse_x - datapoint_x) + bar_thickness / 2;
      // tooltip_y_pos = screen_y - (mouse_y - datapoint_y) + datapoint_height / 2;
      tooltip_y_pos = screen_y - 10;
    } else if (is_metrics_nox_noy && is_metrics_angle) {
      // PIE CHART
      tooltip_x_pos = screen_x + 25;
      // tooltip_y_pos = screen_y - (mouse_y - datapoint_y) + datapoint_height / 2;
      tooltip_y_pos = screen_y - 10;
    }

    selectedDatapoint.style('cursor', 'pointer');
    // d3.selectAll(".datapoint").attr("fill-opacity", 0.3);
    selectedDatapoint.attr('fill-opacity', 1);

    let fragment_vals = [];
    if (is_fragments) {
      fragment_vals = parse_uqkey_nometric(d.fragment_uqkey);
    }

    d3
      .select('#chart-tooltip')
      .style('left', tooltip_x_pos + 'px')
      .style('top', tooltip_y_pos + 'px')
      // .style("opacity", 0.85)
      .style('opacity', 1)
      .style('text-align', 'left')
      .style('font-weight', '400')
      .style('font-size', '14px')
      .style('line-height', '16px')
      .style('border', '1px solid #ffffff')
      .style('color', '#fff')
      // .style("width", "200px")
      // .style("border-radius", "3px")
      .style('background-color', '#f3b562')
      .html(function () {
        let tooltip_text = '';

        tooltip_text += "<div style='padding: 10px;'>";

        if (is_fragments) {
          fragments.map(function (fragment, fragment_index) {
            if (fragment_index > 0) tooltip_text += '<br/>';

            tooltip_text +=
              capitalizeFirstLetter(fragment.field_name) + ': ' + fragment_vals[fragment_index];
          });
        }

        if (is_groupers_x) {
          let x_grouper_vals = parse_uqkey_nometric(d.x_grouper);

          x_groupers.map(function (x_grouper, x_grouper_index) {
            if (x_grouper_index > 0 || is_fragments) {
              tooltip_text += '<br/>';
            }

            tooltip_text +=
              capitalizeFirstLetter(x_grouper.field_name) + ': ' + x_grouper_vals[x_grouper_index];
          });
        }

        if (is_groupers_y) {
          let y_grouper_vals = parse_uqkey_nometric(d.y_grouper);

          y_groupers.map(function (y_grouper, y_grouper_index) {
            if (y_grouper_index > 0 || is_groupers_x || is_fragments) {
              tooltip_text += '<br/>';
            }

            tooltip_text +=
              capitalizeFirstLetter(y_grouper.field_name) + ': ' + y_grouper_vals[y_grouper_index];
          });
        }

        tooltip_text += '</div>';

        if (
          is_metrics_x ||
          is_metrics_y ||
          is_metrics_subject ||
          is_metrics_size ||
          is_metrics_color ||
          is_metrics_angle
        ) {
          tooltip_text += "<div style='padding: 10px; border-top: 1px solid #f3c162;'>";
        }

        if (is_metrics_x) {
          tooltip_text += capitalizeFirstLetter(d.x_metric) + ': ' + d.x_metric_val;
        }

        if (is_metrics_y) {
          if (is_metrics_x) tooltip_text += '<br/>';
          tooltip_text += capitalizeFirstLetter(d.y_metric) + ': ' + d.y_metric_val;
        }

        if (is_metrics_subject) {
          if (is_metrics_x || is_metrics_y) tooltip_text += '<br/>';
          tooltip_text += capitalizeFirstLetter(d.subject_metric) + ': ' + d.subject_metric_val;
        }

        if (is_metrics_size) {
          if (is_metrics_x || is_metrics_y || is_metrics_subject) tooltip_text += '<br/>';
          tooltip_text += capitalizeFirstLetter(d.size_metric) + ': ' + d.size_metric_val;
        }

        if (is_metrics_color) {
          if (is_metrics_x || is_metrics_y || is_metrics_subject || is_metrics_size)
            tooltip_text += '<br/>';
          tooltip_text += capitalizeFirstLetter(d.color_metric) + ': ' + d.color_metric_val;
        }

        if (is_metrics_angle) {
          if (
            is_metrics_x ||
            is_metrics_y ||
            is_metrics_subject ||
            is_metrics_size ||
            is_metrics_color
          )
            tooltip_text += '<br/>';
          tooltip_text += capitalizeFirstLetter(d.angle_metric) + ': ' + d.angle_metric_val;
        }

        if (
          is_metrics_x ||
          is_metrics_y ||
          is_metrics_subject ||
          is_metrics_size ||
          is_metrics_color
        ) {
          tooltip_text += '</div>';
        }

        return tooltip_text;
      });
  });

  datapoints.on('mouseout', function () {
    const selectedDatapoint = d3.select(this);
    const hover_coords = d3.mouse(this);

    // selectedDatapoint.attr("fill-opacity", 0.65);
    d3.selectAll('.datapoint').attr('fill-opacity', 0.65);

    d3.select('#chart-tooltip').style('opacity', 0);
  });
};

export const createTextLabels = function (svg) {
  const self = this;
  const {
    space_for_axes,
    x_uqkeys,
    y_uqkeys,
    horizontal_scroll,
    vertical_scroll,
    container_width,
    container_height,
    padding,
    x_axis_first_label_font_family,
    x_axis_first_label_font_color,
    x_axis_first_label_font_size,
    y_axis_first_label_font_family,
    y_axis_first_label_font_color,
    y_axis_first_label_font_size,
    x_axis_grouper_label_font_family,
    x_axis_grouper_label_font_color,
    x_axis_grouper_label_font_size,
    y_axis_grouper_label_font_family,
    y_axis_grouper_label_font_color,
    y_axis_grouper_label_font_size,
    matrix_fragment_w,
    thickness_multiplier,
    chart_area,
    chart_data,
    xScales,
    yScales,
    sizeScale,
    colorScale,
    is_metrics,
    num_metrics,
    num_xy_metrics,
    is_groupers,
    is_metrics_x_noy,
    is_metrics_nox_y,
    is_metrics_x_y,
    is_metrics_nox_noy,
    is_metrics_x,
    is_metrics_y,
    is_metrics_subject,
    is_metrics_size,
    is_metrics_angle,
    is_groupers_color,
    is_metrics_color,
    is_groupers_x,
    is_groupers_y,
    is_fragments,
  } = this;
  return svg
    .append('g')
    .attr('class', 'textlabels')
    .selectAll('.textlabel')
    .data(chart_data)
    .enter()
    .append('text')
    .attr('class', 'textlabel')
    .attr('x', function (datarecord) {
      if (is_metrics_x_noy) {
        // BAR CHART
        return space_for_axes.left + self.x_calc1(datarecord, chart_area, xScales);
      } else if (is_metrics_nox_y) {
        // BAR CHART
        return space_for_axes.left + self.x_calc2(datarecord);
      } else if (is_metrics_nox_noy) {
        // MATRIX CHART
        let x_pos = 0;
        let fragment_index = datarecord.fragment_uqkey_index - 1;
        let x_index = datarecord.x_uqkey_index - 1;

        x_pos =
          space_for_axes.left +
          matrix_fragment_w * fragment_index +
          matrix_fragment_w / 2 +
          chart_area['width_group'] * x_index;

        return x_pos;
      } else if (is_metrics_x_y) {
        // SCATTER CHART
        return self.x_calc1(datarecord, chart_area, xScales);
      } else return 0;
    })
    .attr('y', function (datarecord) {
      if (is_metrics_x_noy) return self.y_calc2(datarecord, chart_area, yScales);
      else if (is_metrics_nox_y) return self.y_calc1(datarecord, chart_area, yScales);
      else if (is_metrics_nox_noy) {
        let y_pos = 0;
        let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
        let h = chart_area['height_group'] / n;
        let size = 0;

        size = self.getBarThickness(datarecord, thickness_multiplier);

        y_pos =
          // (datarecord.fragment_uqkey_index - 1) * h +
          // h / 2 +
          chart_area['height_group'] / 2 +
          chart_area['height_group'] * (datarecord.y_uqkey_index - 1);
        /*
        y_pos = 0;
        */

        return y_pos;
      } else if (is_metrics_x_y) return self.y_calc1(datarecord, chart_area, yScales);
      else return 0;
    })
    .attr('fill', function (datarecord) {
      let font_color = '#999';
      if (is_metrics_x_y) {
        font_color = '#999';
      } else if (is_metrics_x_noy) {
        font_color = '#999';
      } else {
        let background_color = self.getBackgroundColor(datarecord);
        font_color = getFontColor_forBackgroundRgb(hexToRGB(background_color));
      }
      return font_color;
    })
    .attr('opacity', 1)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'baseline')
    .attr('font-size', '10px')
    .attr('font-weight', '400')
    .attr('font-family', 'Verdana');
};
