/*eslint-disable*/
import {
  calculateChartArea,
  createScales,
  drawSvgContainer,
  sizeAndPositionSvgContainer,
  getLabels_fromUqkeys,
  createXAxesLabels,
  createYAxesLabels,
  positionXAxesLabels,
  positionYAxesLabels,
  createAxesGridlines,
  x_calc1,
  x_calc2,
  y_calc1,
  y_calc2,
  y_calc3,
  getBarThickness,
  getBackgroundColor,
  createInteractions,
  createTextLabels
} from './chartFunctions';
// import chartFunctions from './chartFunctions';
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
  getFontColor_forBackgroundRgb
} from './utilityFunctions';
import d3 from 'd3';

const createChart = function(c) {
  this.createAxesGridlines = createAxesGridlines.bind(this);
  this.drawSvgContainer = drawSvgContainer.bind(this);
  this.calculateChartArea = calculateChartArea.bind(this);
  this.createScales = createScales.bind(this);
  this.sizeAndPositionSvgContainer = sizeAndPositionSvgContainer.bind(this);
  this.getLabels_fromUqkeys = getLabels_fromUqkeys.bind(this);
  this.createXAxesLabels = createXAxesLabels.bind(this);
  this.createYAxesLabels = createYAxesLabels.bind(this);
  this.positionXAxesLabels = positionXAxesLabels.bind(this);
  this.positionYAxesLabels = positionYAxesLabels.bind(this);
  this.x_calc1 = x_calc1.bind(this);
  this.x_calc2 = x_calc2.bind(this);
  this.y_calc1 = y_calc1.bind(this);
  this.y_calc2 = y_calc2.bind(this);
  this.y_calc3 = y_calc3.bind(this);
  this.getBarThickness = getBarThickness.bind(this);
  this.getBackgroundColor = getBackgroundColor.bind(this);
  this.createInteractions = createInteractions.bind(this);
  this.createTextLabels = createTextLabels.bind(this);
  this.chartConfigs = c;

  this.is_metrics =
    c.x_metrics.length > 0 ||
    c.y_metrics.length > 0 ||
    c.size_metrics.length > 0 ||
    c.subject_metrics.length > 0 ||
    c.color_metrics.length > 0;

  this.num_metrics =
    c.x_metrics.length +
    c.y_metrics.length +
    c.size_metrics.length +
    c.subject_metrics.length +
    c.color_metrics.length;

  this.num_xy_metrics = c.x_metrics.length + c.y_metrics.length;

  this.is_groupers =
    c.x_groupers.length > 0 ||
    c.y_groupers.length > 0 ||
    c.subject_groupers.length > 0 ||
    c.shape_groupers.length > 0 ||
    c.color_groupers.length > 0;

  this.is_metrics_x_noy = c.x_metrics.length > 0 && c.y_metrics.length == 0;
  this.is_metrics_nox_y = c.x_metrics.length == 0 && c.y_metrics.length > 0;
  this.is_metrics_x_y = c.x_metrics.length > 0 && c.y_metrics.length > 0;
  this.is_metrics_nox_noy = c.x_metrics.length == 0 && c.y_metrics.length == 0;
  this.is_metrics_x = c.x_metrics.length > 0;
  this.is_metrics_y = c.y_metrics.length > 0;
  this.is_metrics_subject = c.subject_metrics.length > 0;
  this.is_metrics_size = c.size_metrics.length > 0;
  this.is_metrics_angle = c.angle_metrics.length > 0;
  this.is_groupers_color = c.color_groupers.length > 0;
  this.is_metrics_color = c.color_metrics.length > 0;
  this.is_groupers_x = c.x_groupers.length > 0;
  this.is_groupers_y = c.y_groupers.length > 0;
  this.is_fragments = c.fragments.length > 0;

  const space_for_axes = {
    top: 0,
    // left: 200,
    left: 0,
    right: 0,
    bottom: 0
    /*
    top: 0,

    right: 0,
    bottom: 0
    */
  }; // TODO: make these dynamic, replace with axis_space_left, axis_space_bottom
  this.space_for_axes = space_for_axes;

  this.x_axis_first_label_font_family = 'Verdana';
  this.x_axis_first_label_font_color = '#666666';
  this.x_axis_first_label_font_size = '12px';
  this.y_axis_first_label_font_family = 'Verdana';
  this.y_axis_first_label_font_color = '#666666';
  this.y_axis_first_label_font_size = '12px';

  this.x_axis_grouper_label_font_family = 'Verdana';
  this.x_axis_grouper_label_font_color = '#999999';
  this.x_axis_grouper_label_font_size = '12px';
  this.y_axis_grouper_label_font_family = 'Verdana';
  this.y_axis_grouper_label_font_color = '#999999';
  this.y_axis_grouper_label_font_size = '12px';

  let matrix_fragment_w = 0;
  this.matrix_fragment_w = matrix_fragment_w;
  const bar_thickness = c.bar_thickness;
  this.bar_thickness = bar_thickness;
  const hole_size = c.hole_size;
  this.hole_size = hole_size;
  const thickness_multiplier = 0.85;

  this.thickness_multiplier = thickness_multiplier;
  const colorcodes_dictionary = c.colorcodes_dictionary;

  // assign all config to `this`
  Object.keys(c).forEach(key => {
    this[key] = c[key];
  });

  d3.select('.svg_' + c.render_div).remove(); // REMOVE OLD CHART, update new
  const svg = this.drawSvgContainer(c.render_div);
  this.svg = svg;

  this.createXAxesLabels(svg);
  this.createYAxesLabels(svg);

  const chart_area = this.calculateChartArea();
  this.chart_area = chart_area;

  this.positionXAxesLabels();
  this.positionYAxesLabels();

  const value_size_min = 50 * bar_thickness;
  const value_size_max = 100 * bar_thickness;
  const scales = this.createScales(
    c.x_axis_ranges,
    c.y_axis_ranges,
    value_size_min,
    value_size_max,
    c
  );
  this.scales = scales;
  const xScales = scales.xScales;
  const yScales = scales.yScales;
  const sizeScale = scales.sizeScale;
  const colorScale = scales.colorScale;
  this.xScales = xScales;
  this.yScales = yScales;
  this.sizeScale = sizeScale;
  this.colorScale = colorScale;

  this.createAxesGridlines(svg);

  this.sizeAndPositionSvgContainer();

  const self = this;
  // draw datapoints
  let datapoints = svg
    .append('g')
    .attr('transform', 'translate(' + space_for_axes.left + ',' + space_for_axes.top + ')')
    .selectAll('.datapoint');

  const {
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
    is_fragments
  } = this;

  if (is_metrics_x_noy || is_metrics_nox_y) {
    // DRAW BAR CHART
    datapoints = datapoints
      .data(c.chart_data)
      .enter()
      .append('rect')
      .attr('class', 'datapoint')
      .attr('x', function(datarecord) {
        let x_pos = 0;

        if (is_metrics_x_noy) {
          x_pos =
            self.x_calc1(datarecord, chart_area, xScales) -
            xScales[datarecord.x_uqkey_scale_num](datarecord.x_metric_val);
        } else if (is_metrics_nox_y) {
          x_pos =
            self.x_calc2(datarecord) - self.getBarThickness(datarecord, thickness_multiplier) / 2;
        }

        return x_pos;
      })
      .attr('y', function(datarecord) {
        let y_pos = 0;

        if (is_metrics_x_noy) {
          y_pos =
            self.y_calc2(datarecord, chart_area, yScales) -
            self.getBarThickness(datarecord, thickness_multiplier) / 2;
        } else if (is_metrics_nox_y) {
          y_pos = self.y_calc1(datarecord, chart_area, yScales);
        }

        return y_pos;
      })
      .attr('width', function(datarecord) {
        let w = 0;

        if (is_metrics_nox_y) {
          if (c.size_metrics.length > 0) {
            w = sizeScale(datarecord.size_metric_val);
          } else {
            w = self.getBarThickness(datarecord, thickness_multiplier);
          }
        } else if (is_metrics_x_noy) {
          w = xScales[datarecord.x_uqkey_scale_num](datarecord.x_metric_val);
          // w = 10;
        }

        return w;
      })
      .attr('height', function(datarecord) {
        let h = 0;

        if (is_metrics_x_noy) {
          if (c.size_metrics.length > 0) {
            h = sizeScale(datarecord.size_metric_val);
          } else {
            h = self.getBarThickness(datarecord, thickness_multiplier);
          }
        } else if (is_metrics_nox_y) {
          h =
            chart_area['height_group'] -
            yScales[datarecord.y_uqkey_scale_num](datarecord.y_metric_val);
        }

        return h;
      });
  } else if (is_metrics_x_y) {
    // DRAW SCATTER CHART
    datapoints = datapoints
      .data(c.chart_data)
      .enter()
      .append('circle')
      .attr('class', 'datapoint')
      .attr('cx', function(datarecord) {
        let x_pos = 0;
        x_pos = self.x_calc1(datarecord, chart_area, xScales);

        return x_pos;
      })
      .attr('cy', function(datarecord) {
        let y_pos = 0;
        y_pos = self.y_calc1(datarecord, chart_area, yScales);

        return y_pos;
      })
      .attr('r', function(datarecord) {
        if (c.size_metrics.length > 0) {
          return sizeScale(datarecord.size_metric_val);
        } else {
          return 5;
        }
      });
  } else if (is_metrics_nox_noy && is_metrics_angle) {
    // DRAW PIE CHART
    let pie = d3.layout.pie().sort(null).value(function(datarecord) {
      return datarecord.angle_metric_val;
    });

    x_uqkeys.map(function(x_uqkey, x_uqkey_index) {
      y_uqkeys.map(function(y_uqkey, y_uqkey_index) {
        let filtered_data = chart_data.filter(function(d, i) {
          if (d.x_uqkey == x_uqkey.val && d.y_uqkey == y_uqkey.val) {
            return d;
          }
        });

        let arc = d3.svg
          .arc()
          .outerRadius(function(datarecord) {
            let radius = 0;
            if (c.size_metrics.length > 0) {
              radius = pie_size;
            } else {
              radius = Math.min(chart_area['width_group'], chart_area['height_group']) / 2;
              radius = radius - 10;
            }

            return radius;
          })
          .innerRadius(function(datarecord) {
            let radius = 0;
            if (c.size_metrics.length > 0) {
              radius = pie_size;
            } else {
              radius = Math.min(chart_area['width_group'], chart_area['height_group']) / 2;
              radius = radius - 10;
            }

            return radius * hole_size;
          });
        let pie_data = pie(filtered_data);
        let pie_size = 0;

        let g = datapoints.data(pie_data).enter().append('g').attr('class', 'datapoint');

        g.attr(
          'transform',
          'translate(' +
            // (index + 1) * chart_area["width_group"] +
            (chart_area['width_group'] / 2 + x_uqkey_index * chart_area['width_group']) +
            ',' +
            (chart_area['height_group'] / 2 + y_uqkey_index * chart_area['height_group']) +
            ')'
        );

        g
          .append('path')
          .attr('class', function(datarecord) {
            pie_size += sizeScale(datarecord.data.size_metric_val);
            return 'dummy_path';
          })
          .attr('d', arc)
          .style('fill', function(datarecord) {
            let color = '#CCC';

            if (is_groupers_color) {
              color = self.getBackgroundColor(datarecord.data);
            } else if (is_metrics_color) {
              color = colorScale(datarecord.color_metric_val);
            }

            return color;
          })
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
      });
    });
  } else if (is_metrics_nox_noy && !is_metrics_angle) {
    // DRAW MATRIX CHART
    datapoints = datapoints
      .data(c.chart_data)
      .enter()
      .append('rect')
      .attr('class', 'datapoint')
      .attr('width', function(datarecord) {
        if (is_metrics_size) {
          return sizeScale(datarecord.size_metric_val);
        } else {
          let n = datarecord.fragment_uqkey_maxdenseindex; // n is length of fragment_uqkeys
          matrix_fragment_w = chart_area['width_group'] / n;
          return matrix_fragment_w;
        }
      })
      .attr('height', function(datarecord) {
        if (is_metrics_size) {
          return sizeScale(datarecord.size_metric_val);
        } else {
          let size = 0;
          // let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
          let n = 1;
          let h = chart_area['height_group'] / n;

          size = h;
          // size = getBarThickness(datarecord, thickness_multiplier);

          return size;
        }
      })
      .attr('x', function(datarecord) {
        let x_pos = 0;
        let fragment_index = datarecord.fragment_uqkey_dense_index - 1;
        let x_index = datarecord.x_uqkey_index - 1;

        x_pos = matrix_fragment_w * fragment_index + chart_area['width_group'] * x_index;

        return x_pos;
      })
      .attr('y', function(datarecord) {
        let y_pos = 0;
        let n = datarecord.fragment_uqkey_maxindex; // n is length of fragment_uqkeys
        let h = chart_area['height_group'] / n;
        let size = 0;

        size = self.getBarThickness(datarecord, thickness_multiplier);

        y_pos =
          // (datarecord.fragment_uqkey_index - 1) * h +
          // h / 2 +
          // chart_area["height_group"] / 2 +
          chart_area['height_group'] * (datarecord.y_uqkey_index - 1);
        /*
        y_pos = 0;
        */

        return y_pos;
      });
  }

  datapoints
    .attr('stroke', '#fff')
    .attr('stroke-width', function() {
      if (is_metrics_nox_noy) {
        return 1;
      }
      return 0;
    })
    .attr('fill', function(datarecord) {
      let color = '#CCC';
      // color = "#ffd777";

      if (is_groupers_color) {
        color = self.getBackgroundColor(datarecord);
      } else if (is_metrics_color) {
        color = colorScale(datarecord.color_metric_val);
      }

      return color;
    })
    .attr('fill-opacity', 0.65);

  this.createInteractions();

  let textlabels = this.createTextLabels(svg);
  if (is_metrics_x_noy) {
    // BAR CHART
    textlabels.text(function(datarecord) {
      return datarecord.x_metric_val;
    });
    textlabels.attr('dx', function(datarecord) {
      return 2 + 'em';
    });
  } else if (is_metrics_nox_y) {
    // BAR CHART
    textlabels.text(function(datarecord) {
      return datarecord.y_metric_val;
    });
    textlabels.attr('dy', function(datarecord) {
      let barheight = yScales[0](datarecord.y_metric_val);
      return 2 + 'em';
    });
  } else if (is_metrics_nox_noy && !is_metrics_angle) {
    // MATRIX CHART
    if (matrix_fragment_w > 150) {
      textlabels.text(function(datarecord) {
        let fragment_vals = [];
        if (is_fragments) {
          fragment_vals = parse_uqkey_nometric(datarecord.fragment_uqkey);
        }
        let fragments_csv = fragment_vals.join();
        return fragments_csv;
      });

      textlabels
        .attr('dx', function(datarecord) {
          return 0 + 'em';
        })
        .attr('dy', function(datarecord) {
          return 0 + 'em';
        })
        .attr('font-size', '12px');
    }
  } else if (is_metrics_x_y) {
    // SCATTER CHART
    // DON'T SHOW TEXT LABELS
  }
};

export default createChart;
