import d3 from 'd3';

export default function drawBarChart(dom, props) {
  var data = props.data_for_chart;

  var canvasWidth = props.width;
  var canvasHeight = props.height;

  d3.select(dom).select('svg').remove(); // IMPORTANT TO CLEAR OUT OLD CHART, BUT NOT OPTIMAL PERFORMANCE FOR RENDERING

  var chart_block = dom;
  var chart_block_d3 = d3.select(dom);
  var global_bar_hovered_state = 'OFF';
  var global_bar_clicked_state = 'OFF';

  // =============== DATASET FIELD TYPE CLASSIFICATION ===============
  var data_fields = {
    dimensions: ['country'],
    metrics: ['cats'],
  };

  // =============== DATA FIELD TO VISUAL ENCODING MAPPING ===============
  var xaxis_vencoding = {
    dimensions: ['country'],
    metrics: [],
  };

  var yaxis_vencoding = {
    dimensions: [],
    metrics: ['cats'],
  };

  var chart_granularity = {
    dimensions: ['country'],
    metrics: ['cats'],
  };

  // =============== CHART FORMATTING ===============
  var chart_left_margin = 0;
  var chart_right_margin = 0;
  var chart_top_margin = 0;
  var chart_bottom_margin = 0;

  // =============== BARS FORMATTING ===============
  // REGULAR STATE
  var bar_fill_colors = ['#fd8b73'];
  var bar_fill_color_opacity = 1;
  var bar_border_color = '#fc6141';
  var bar_border_size = 1;
  var bar_border_radius = 1;
  var bar_fatness_percent = 30;

  // HOVER STATE
  var bar_fill_colors_hover = ['#fdd073'];
  var bar_fill_color_opacity_hover = 1;
  var bar_border_color_hover = '#fcbf41';
  var bar_border_size_hover = 1;
  var bar_border_radius_hover = 1;

  // CLICK STATE
  var bar_fill_colors_click = ['#3C3C3C'];
  var bar_fill_color_opacity_click = 1;
  var bar_border_color_click = 'black';
  var bar_border_size_click = 1;
  var bar_border_radius_click = 1;

  // =============== LABELS FORMATTING ===============
  var label_font_size_percent = 11;
  var label_font_family = 'Arial';
  var label_font_weight = '';
  var label_font_color = 'pink';

  // =============== TOOLTIP/ONCLICK ADHOC BLOCKS FORMATTING ===============

  var adhoc_content_block_1_width_percent = 200;
  var adhoc_content_block_1_height_percent = 100;
  var adhoc_content_block_1_font_size_percent = 12;
  var adhoc_content_block_1_font_family = 'Helvetica, sans-serif';
  var adhoc_content_block_1_font_weight = '';
  var adhoc_content_block_1_font_color = 'white';
  var adhoc_content_block_1_background_color = 'black';
  var adhoc_content_block_1_background_transparency = '90';

  var adhoc_content_block_2_width_percent = 300;
  var adhoc_content_block_2_height_percent = 200;
  var adhoc_content_block_2_font_size_percent = 12;
  var adhoc_content_block_2_font_family = 'Helvetica, sans-serif';
  var adhoc_content_block_2_font_weight = '';
  var adhoc_content_block_2_font_color = 'black';
  var adhoc_content_block_2_background_color = 'white';
  var adhoc_content_block_2_background_transparency = '100';

  // =================== AKASH CONFIGURATION ENDS =================== //

  /* =============== // OZ EDIT =============== */
  // Update data for the group by key
  for (var rownum = 0; rownum < data.length; rownum++) {
    var return_value = '';
    for (
      var xaxis_vencoding_dimnum = 0;
      xaxis_vencoding_dimnum < xaxis_vencoding.dimensions.length;
      xaxis_vencoding_dimnum++
    ) {
      var xaxis_vencoding_dimension =
        xaxis_vencoding.dimensions[xaxis_vencoding_dimnum];
      return_value =
        return_value + '_' + data[rownum][xaxis_vencoding_dimension];
    }
    data[rownum]['__GROUPBY__'] = return_value;
  }
  console.log('----------');
  console.log(data);
  console.log('----------');

  var xAxisKeys = Object.keys(
    d3
      .nest()
      .key(function (d) {
        var return_value = '';
        for (var i = 0; i < xaxis_vencoding.dimensions.length; i++) {
          return_value = return_value + '_' + d[xaxis_vencoding.dimensions[i]];
        }
        return return_value;
      })
      .rollup(function (d) {
        return 1;
      })
      .map(data)
  ).sort();

  console.log('XAXIS0', xAxisKeys);

  var xAxisKeys_1 = Object.keys(
    d3
      .nest()
      .key(function (d) {
        var return_value = d[xaxis_vencoding.dimensions[0]];
        return return_value;
      })
      .rollup(function (d) {
        return 1;
      })
      .map(data)
  ).sort();

  console.log('XAXIS0', xAxisKeys_1);

  /* =============== // OZ EDIT =============== */

  var dimentionsOfSVG = { width: canvasWidth, height: canvasHeight };
  var dimentionsOfMargins = { top: 20, right: 20, bottom: 60, left: 80 };
  var width =
    dimentionsOfSVG.width -
    dimentionsOfMargins.left -
    dimentionsOfMargins.right;
  var height =
    dimentionsOfSVG.height -
    dimentionsOfMargins.top -
    dimentionsOfMargins.bottom;

  // This is where you define the scale for x axis
  var xScale_1_1 = d3.scale
    .ordinal() // AKASH EDIT
    .rangeRoundBands([0, width], 0.05);

  var xScale_1_2 = d3.scale
    .ordinal() // AKASH EDIT
    .rangeRoundBands([0, width], 0.05);

  // This is where you define the scale for y axis
  var yScale_1_1 = d3.scale.linear().rangeRound([height, 0]);

  xScale_1_1.domain(xAxisKeys_1); // OZ EDIT // removing this broke the chart

  xScale_1_2.domain(xAxisKeys); // OZ EDIT // removing this broke the chart

  yScale_1_1.domain([
    0,
    d3.max(data, function (d) {
      return d[yaxis_vencoding.metrics[0]];
    }),
  ]); // AKASH EDIT

  // Configure x axis generator
  // var xAxis = d3.svg.axis() //AKASH EDIT
  var draw_x_axis_1_1 = d3.svg
    .axis() // AKASH EDIT
    .scale(xScale_1_1)
    .tickSize(25, 0) // AKASH EDIT
    .orient('bottom');

  // Configure y axis generator
  // var yAxis = d3.svg.axis() // AKASH EDIT
  var draw_y_axis_1_1 = d3.svg
    .axis() // this is basically a function to draw axis // AKASH EDIT
    .scale(yScale_1_1)
    .ticks(15) // AKASH EDIT
    // .tickFormat(yearformat) // AKASH EDIT

    .tickSize(6, 0) // AKASH EDIT
    .orient('left');

  // SVG Dimentions
  var svg = chart_block_d3 // d3.select("#chart") // AKASH EDIT
    .append('svg')
    .attr('width', dimentionsOfSVG.width)
    .attr('height', dimentionsOfSVG.height)
    .append('g')
    .attr(
      'transform',
      'translate(' +
        dimentionsOfMargins.left +
        ',' +
        dimentionsOfMargins.top +
        ')'
    );
  function make_x_gridLines() {
    return d3.svg.axis().scale(xScale_1_2).orient('bottom');
  }

  function make_y_gridLines() {
    return d3.svg.axis().scale(yScale_1_1).orient('left');
  }

  // DRAWING HORIZONTAL GRIDLINES // AKASH EDIT
  svg
    .append('g')
    .style('stroke', 'lightgrey')
    .style('opacity', 0.7)
    .style('stroke-width', 0.5)
    .attr('transform', 'translate(0,' + height + ')')
    .call(make_x_gridLines().tickSize(-height, 0, 0).tickFormat(''));

  // DRAWING VERTICAL GRIDLINES // AKASH EDIT
  svg
    .append('g')
    .style('stroke', 'lightgrey')
    .style('opacity', 0.7)
    .style('stroke-width', 0.5)
    .call(make_y_gridLines().tickSize(-width, 0, 0).tickFormat(''));

  var groups = svg
    .selectAll('rect')
    .data(data)
    .enter()
    .append('g')
    .attr('transform', function (d, i) {
      //  return "translate(" + xScale(d[ xaxis_vencoding.dimensions[(xaxis_vencoding.dimensions.length-1) ] ]) + ",0)"; // AKASH EDIT

      // console.log(d['__GROUPBY__'], xScale(d['__GROUPBY__'])); // OZ EDIT
      return 'translate(' + xScale_1_2(d['__GROUPBY__']) + ',0)'; // OZ EDIT
    });

  groups
    .append('rect')
    .attr('class', 'bars_metric_1') // AKASH EDIT
    .attr('x', 0)
    .attr('y', function (d) {
      return yScale_1_1(d[yaxis_vencoding.metrics[0]]);
    }) // AKASH EDIT
    .attr('fill', bar_fill_colors[0]) // AKASH EDIT
    .attr('opacity', bar_fill_color_opacity) // AKASH EDIT
    .attr('stroke', bar_border_color) // AKASH EDIT
    .attr('stroke-width', bar_border_size) // AKASH EDIT
    .attr('rx', bar_border_radius) // AKASH EDIT
    .attr('ry', bar_border_radius) // AKASH EDIT
    .attr('width', xScale_1_1.rangeBand() * (bar_fatness_percent / 100)) // AKASH EDIT
    .attr('height', function (d) {
      return height - yScale_1_1(d[yaxis_vencoding.metrics[0]]);
    }); // AKASH EDIT

  // This is how the tool tip gets added -- TOOLTIPS and TEXT LABELS are different. They can co-exist or just one or none of them could exist. In the code below, we are creating TEXT LABEL // AKASH EDIT
  groups
    .append('text')
    .attr('x', xScale_1_1.rangeBand() / 2)
    .text(function (d) {
      return d[yaxis_vencoding.metrics[0]]; // AKASH EDIT
    })
    .attr('font-family', label_font_family) // AKASH EDIT
    .attr('font-size', label_font_size_percent + 'px') // AKASH EDIT
    .attr('y', function (d) {
      return yScale_1_1(d[yaxis_vencoding.metrics[0]]) + 14; // AKASH EDIT
    })
    .attr('fill', 'white');

  // Add the x-axis defined above
  var group_of_x_axes = svg.append('g').attr('class', 'x_axes'); // AKASH EDIT

  var x_axes_selector_div = group_of_x_axes // AKASH EDIT
    .append('rect') // AKASH EDIT
    .attr('class', 'x_axes_selector_div') // AKASH EDIT
    .style({
      // AKASH EDIT
      fill: 'white', // AKASH EDIT
      width: '100%', // AKASH EDIT
      height: '100%', // AKASH EDIT
    }) // AKASH EDIT
    .attr('transform', 'translate(0,' + height + ')'); // AKASH EDIT

  var group_x_axis_1 = group_of_x_axes.append('g').attr('class', 'x_axis_1');

  group_x_axis_1
    .append('g') // AKASH EIT // AKASH EDIT
    /* .attr("class", "axis")*/ .attr('class', 'axis x_axis_1_1') // AKASH EDIT
    // X-AXIS --- AXIS LINE STYLING // AKASH EDIT
    .style({
      // AKASH EDIT
      stroke: '#AEAEAE', // AKASH EDIT
      fill: 'none', // AKASH EDIT
      'stroke-width': '1px', // AKASH EDIT
      'shape-rendering': 'crispEdges', // AKASH EDIT
    }) // AKASH EDIT
    .attr('transform', 'translate(0,' + height + ')')
    .call(draw_x_axis_1_1)
    // X-AXIS --- AXIS TEXT STYLING // AKASH EDIT
    .selectAll('text')
    .style({
      // AKASH EDIT
      fill: '#1E1E1E', // AKASH EDIT
      'stroke-width': '0px', // AKASH EDIT
      font: '12px Arial', // AKASH EDIT
    }); // AKASH EDIT

  group_x_axis_1
    .append('g') // AKASH EDIT // AKASH EDIT
    /* .attr("class", "axis")*/ .attr('class', 'axis x_axis_1_2') // AKASH EDIT
    // X-AXIS --- AXIS LINE STYLING // AKASH EDIT
    .style({
      // AKASH EDIT
      stroke: '#CECECE', // AKASH EDIT
      fill: 'none', // AKASH EDIT
      'stroke-width': '1px', // AKASH EDIT
      'shape-rendering': 'crispEdges', // AKASH EDIT
    }) // AKASH EDIT
    // .attr("transform","translate(0,"+(height+30)+")") // AKASH EDIT
    .attr('transform', 'translate(0,' + height + ')'); // AKASH EDIT

  group_of_x_axes
    .append('g') // AKASH EDIT
    .append('text')
    .attr('class', 'label')
    .attr('x', width)
    .style('text-anchor', 'end')
    .attr(
      'transform',
      'translate(0,' + (height + dimentionsOfMargins.bottom) + ')'
    ) // AKASH EDIT
    /*
   .attr("y",function(d){ return ((dimentionsOfMargins.bottom/2)+6); })  // This is where the label is placed for the x-axis. Adjust height of label here
   */ .attr(
      'x',
      function () {
        return width / 2;
      }
    )
    .text('Country');

  // Add the y-axis defined above and also add correspoding label
  var group_of_y_axes = svg.append('g').attr('class', 'y_axes'); // AKASH EDIT

  var y_axes_selector_div = group_of_y_axes // AKASH EDIT
    .append('rect') // AKASH EDIT
    .attr('class', 'y_axes_selector_div') // AKASH EDIT
    .style({
      // AKASH EDIT
      fill: 'white', // AKASH EDIT
      width: dimentionsOfMargins.left + 'px', // AKASH EDIT
      height: '100%', // AKASH EDIT
    })
    .attr('x', function () {
      return -1 * dimentionsOfMargins.left;
    });

  var group_y_axis_1 = group_of_y_axes.append('g').attr('class', 'y_axis_1');

  group_y_axis_1
    .append('g') // AKASH EDIT
    /* .attr("class", "axis")*/ .attr('class', 'axis y_axis_1_1') // AKASH EDIT
    // Y-AXIS --- AXIS LINE STYLING // AKASH EDIT
    .style({
      // AKASH EDIT
      stroke: '#CECECE', // AKASH EDIT
      fill: 'none', // AKASH EDIT
      'stroke-width': '1px', // AKASH EDIT
      'shape-rendering': 'crispEdges', // AKASH EDIT
    }) // AKASH EDIT
    .call(draw_y_axis_1_1)
    // Y-AXIS --- AXIS TEXT STYLING // AKASH EDIT
    .selectAll('text')
    .style({
      // AKASH EDIT
      fill: '#1E1E1E', // AKASH EDIT
      'stroke-width': '0px', // AKASH EDIT
      font: '12px Arial', // AKASH EDIT
    });

  group_of_y_axes
    .append('g')
    .append('text')
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .attr('y', function () {
      return -1 * dimentionsOfMargins.left + 20;
    })
    .attr('x', function () {
      return -1 * height / 2;
    })
    .text('Cats');

  // TOOLTIP/ONCLICK ADHOC CONTENT STYLING // AKASH EDIT
  // // AKASH EDIT //
  chart_block_d3
    .append('div')
    .attr('class', 'adhoc_content_block_1')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('z-index', '10')
    .style('text-align', 'left')
    .style('margin', 'auto')
    .style('padding-left', '10px')
    .style('padding-top', '7px')
    .style('background', adhoc_content_block_1_background_color)
    .style('opacity', adhoc_content_block_1_background_transparency / 100 + '')
    .style('color', adhoc_content_block_1_font_color)
    .style('font-size', adhoc_content_block_1_font_size_percent + 'px')
    .style('font-family', adhoc_content_block_1_font_family)
    .style('width', adhoc_content_block_1_width_percent + 'px')
    .style('height', adhoc_content_block_1_height_percent + 'px')
    .style('line-height', '15px')
    .style('border-radius', '4px')
    .style('visibility', 'hidden');

  chart_block_d3
    .append('div')
    .attr('class', 'adhoc_content_block_2')
    .style('position', 'absolute')
    .style('top', '0')
    .style('left', '0')
    .style('z-index', '10')
    .style('text-align', 'left')
    .style('margin', 'auto')
    .style('padding-left', '10px')
    .style('padding-top', '7px')
    .style('background', adhoc_content_block_2_background_color)
    .style('opacity', adhoc_content_block_2_background_transparency / 100 + '')
    .style('color', adhoc_content_block_2_font_color)
    .style('font-size', adhoc_content_block_2_font_size_percent + 'px')
    .style('font-family', adhoc_content_block_2_font_family)
    .style('width', adhoc_content_block_2_width_percent + 'px')
    .style('height', adhoc_content_block_2_height_percent + 'px')
    .style('line-height', '15px')
    .style('border-radius', '4px')
    .style('visibility', 'hidden');
  // // AKASH EDIT //

  // =========================== AKASH EVENT HANDLERS =========================== //
  var bars_metric_1 = chart_block_d3.selectAll('.bars_metric_1');

  // =============== MOUSEOVER EVENT ===============
  bars_metric_1.on('mouseover', function (d) {
    var selected_bar = d3.select(this);

    var selected_bar_data = selected_bar.datum();

    var mouse_position_x = d3.mouse(chart_block)[0];
    var mouse_position_y = d3.mouse(chart_block)[1] + 30;

    if (
      global_bar_hovered_state == 'OFF' && global_bar_clicked_state == 'OFF'
    ) {
      selected_bar
        .style('fill', bar_fill_colors_hover[0])
        .style('stroke', bar_border_color_hover)
        .style('stroke-width', bar_border_size_hover);

      var tooltip_content =
        '<span> Country: ' +
        selected_bar_data[chart_granularity.dimensions[0]] +
        ' </span>' +
        ' </br>' +
        '<span> Cats: ' +
        selected_bar_data[chart_granularity.metrics[0]] +
        ' </span>';

      chart_block_d3
        .select('.adhoc_content_block_1')
        .style('left', mouse_position_x + 'px')
        .style('top', mouse_position_y + 'px')
        .style('visibility', 'visible')
        .html(tooltip_content);

      global_bar_hovered_state = 'ON';
    }
  });

  // =============== MOUSEOUT EVENT ===============
  bars_metric_1.on('mouseout', function (d) {
    var selected_bar = d3.select(this);

    if (global_bar_hovered_state == 'ON' && global_bar_clicked_state == 'OFF') {
      selected_bar
        .style('fill', bar_fill_colors[0])
        .style('stroke', bar_border_color)
        .style('stroke-width', bar_border_size);

      chart_block_d3
        .select('.adhoc_content_block_1')
        .style('visibility', 'hidden');

      global_bar_hovered_state = 'OFF';
    }
  });

  // =============== CLICK EVENT ===============
  bars_metric_1.on('click', function (d) {
    var selected_bar = d3.select(this);

    var selected_bar_data = selected_bar.datum();

    var mouse_position_x = d3.mouse(chart_block)[0];
    var mouse_position_y = d3.mouse(chart_block)[1] + 30;

    if (global_bar_clicked_state == 'OFF') {
      selected_bar
        .style('fill', bar_fill_colors_click[0])
        .style('stroke', bar_border_color_click)
        .style('stroke-width', bar_border_size_click);

      var adhoc_content =
        '<span> Country: ' +
        selected_bar_data[chart_granularity.dimensions[0]] +
        ' </span>' +
        ' </br>' +
        '<span> Cats: ' +
        selected_bar_data[chart_granularity.metrics[0]] +
        ' </span>';

      chart_block_d3
        .select('.adhoc_content_block_2')
        .style('left', mouse_position_x + 'px')
        .style('top', mouse_position_y + 'px')
        .style('visibility', 'visible')
        .html(adhoc_content);
      chart_block_d3
        .select('.adhoc_content_block_1')
        .style('visibility', 'hidden');

      global_bar_clicked_state = 'ON';
      global_bar_hovered_state = 'OFF';
    } else if (global_bar_clicked_state == 'ON') {
      selected_bar
        .style('fill', bar_fill_colors[0])
        .style('stroke', bar_border_color)
        .style('stroke-width', bar_border_size);

      chart_block_d3
        .select('.adhoc_content_block_2')
        .style('visibility', 'hidden');

      global_bar_clicked_state = 'OFF';
      global_bar_hovered_state = 'OFF';
    }
  });

  // MIGHT BE MOVED TO EXTERNAL CODE FINALLY
  x_axes_selector_div.on('mouseover', function (d) {
    x_axes_selector_div.style('fill', '#F0F0F0');
  });
  x_axes_selector_div.on('mouseout', function (d) {
    x_axes_selector_div.style('fill', 'white');
  });

  y_axes_selector_div.on('mouseover', function (d) {
    y_axes_selector_div.style('fill', '#F0F0F0');
  });
  y_axes_selector_div.on('mouseout', function (d) {
    y_axes_selector_div.style('fill', 'white');
  });
  // =========================== AKASH EVENT HANDLERS =========================== //
}
