/* eslint-disable */
import d3 from 'd3';
const nodeTypes = {
  GROUP: 'GROUP',
  DATASET: 'DATASET',
  SQL: 'SQL',
};

const assetRelationType = {
  INFLOW: 'INFLOW',
  OUTFLOW: 'OUTFLOW',
};

const colors = {
  SQL: {
    fill: '#00BD9C',
    border: '#48CDB5',
  },
  GROUP: {
    fill: '#ec0b43',
    border: '#f63465',
  },
  DATASET: {
    fill: '#2D96DE',
    border: '#5EAEE6',
  },
  CHART: {
    fill: '#9C55B8',
    border: '#B27BC8',
  },
};

let inflowSVGGroup;
let outflowSVGGroup;
let svgGroup;
let tree = d3.layout.tree();
let viewerWidth;
let viewerHeight;
let inflowTreeHeight;
let outflowTreeHeight;
let totalNodes = 0;
let maxLabelLength = 0;
// Misc. variables
const duration = 750;
let baseSvg;
let scale;
let x;
let y;
let inflowRoot;
let outflowRoot;
let onAssetNodeClick = null;
const viewPortMargin = 100;

const svgGroupTranslate = {
  x: null,
  y: null,
  scale: null,
};

const constructTreeData = (relationType, treeData) => {
  treeData = Object.assign({}, treeData);
  if (
    treeData.inflow &&
    !treeData.inflow.length &&
    relationType === assetRelationType.INFLOW
  ) {
    return {};
  }
  if (
    treeData.outflow &&
    !treeData.outflow.length &&
    relationType === assetRelationType.OUTFLOW
  ) {
    return {};
  }
  const newTreeData = Object.assign({}, {}, treeData);
  delete newTreeData.inflow;
  delete newTreeData.outflow;
  const relationTreeData = treeData[relationType.toLowerCase()].slice(0);
  const groupChildren = {};
  newTreeData.children = [];
  relationTreeData.forEach(data => {
    if (groupChildren[data.type]) {
      groupChildren[data.type].children.push(data);
    } else {
      groupChildren[data.type] = {};
      groupChildren[data.type].children = [data];
    }
  });
  Object.keys(groupChildren).forEach(groupKey => {
    newTreeData.children.push({
      name: groupKey,
      type: nodeTypes.GROUP,
      children: groupChildren[groupKey].children,
    });
  });
  return newTreeData;
};

function zoom() {
  // console.info('zoom', d3.event);
  // svgGroup.attr(
  //   'transform',
  //   `translate(${d3.event.translate}) scale(${d3.event.scale})`
  // );
  svgGroup.attr(
    'transform',
    `translate(${d3.event.translate[0] + svgGroupTranslate.x}, ${d3.event.translate[1] + svgGroupTranslate.y}) scale(${d3.event.scale * svgGroupTranslate.scale})`
  );
}

const zoomListener = d3.behavior.zoom().scaleExtent([0.01, 3]).on('zoom', zoom);

// Function to center node when clicked/dropped so node doesn't get
// lost when collapsing/moving with large amount of children.
function centerNode(source) {
  // console.info('centerNode', source);
  scale = zoomListener.scale();
  x = -source.y0;
  y = -source.x0;

  x = x * scale;
  y = y * scale;
  // const flowsGroup = d3.select('g.flows');
  // const flowsGroupBox = flowsGroup.node().getBBox();

  let inflowRootNodeTranslate;
  let outflowRootNodeTranslate;
  const htmlForInflowNode = d3.select('g.node.root.in')[0][0].outerHTML;
  const htmlForOutflowNode = d3.select('g.node.root.out')[0][0].outerHTML;
  const extractTranslatePattern = /transform="translate\((.*)\)">/;
  const inflowTranslateMatch = htmlForInflowNode.match(extractTranslatePattern);
  const outflowTranslateMatch = htmlForOutflowNode.match(
    extractTranslatePattern
  );
  inflowTranslateMatch &&
    (inflowRootNodeTranslate = inflowTranslateMatch[1].split(','));
  outflowTranslateMatch &&
    (outflowRootNodeTranslate = outflowTranslateMatch[1].split(','));
  // console.info(inflowRootNodeTranslate, outflowRootNodeTranslate);
  d3
    .selectAll('g.flow')
    .transition()
    .duration(duration)
    .attr('transform', function() {
      const node = d3.select(this);
      const diff = Math.abs(inflowTreeHeight - outflowTreeHeight);
      const isInflowTreeGreater = inflowTreeHeight > outflowTreeHeight;
      const translateYDiff = Math.abs(
        inflowRootNodeTranslate[1] - outflowRootNodeTranslate[1]
      );
      if (diff && node.classed('in')) {
        if (!isInflowTreeGreater) {
          return `translate(${x}, ${translateYDiff}) scale(${scale})`;
        }
      } else if (diff && node.classed('out')) {
        if (isInflowTreeGreater) {
          return `translate(${x}, ${translateYDiff}) scale(${scale})`;
        }
      }
      return `translate(${x}, ${y}) scale(${scale})`;
    });
  scaleAndTranslateFlowsGroup();
}

function scaleAndTranslateFlowsGroup() {
  /**
  * Scale the content according to SVG View Port
  */
  const flowsGroup = d3.select('g.flows');
  const flowsGroupSize = flowsGroup.node().getBBox();
  // if (flowsGroupSize.height < viewerHeight) {
  //   return;
  // }

  // TODO: Improve this scaling formula
  const flowsGroupScale = Math.min(
    viewerHeight / flowsGroupSize.height,
    viewerWidth / flowsGroupSize.width
  );

  console.info(viewerWidth, flowsGroupSize, viewerHeight);
  /**
   * When flowsGroupScale is 1, there is no need for scaling the content
   * so reset the svgGroupTranslate properties to default scale
   * 
   * Otherwise, apply the scaling factor and change the translate co-ordinates and scale property in svgGroupTranslate
   * 
   * This is important since it is required for calculating translate and scale 
   * properties during zooming/panning/dragging #refer zoom() function
   */
  if (flowsGroupScale !== 1) {
    svgGroupTranslate.scale = flowsGroupScale;
    svgGroupTranslate.x = 0;
    // svgGroupTranslate.x = (viewerWidth) * flowsGroupScale;
    // TODO: Improve vertical alignment of content
    svgGroupTranslate.y = 0;
    console.info(svgGroupTranslate);
    flowsGroup.attr(
      'transform',
      `translate(${svgGroupTranslate.x}, 0) scale(${flowsGroupScale})`
    );
  } else {
    svgGroupTranslate.scale = flowsGroupScale;
    svgGroupTranslate.x = 0;
    svgGroupTranslate.y = 0;
  }
}

// Toggle children function
function toggleChildren(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else if (d._children) {
    d.children = d._children;
    d._children = null;
  }
  return d;
}

// Toggle children on click.
function click(relationType, d) {
  if (d3.event.defaultPrevented) return; // click suppressed
  onAssetNodeClick(d);
  // d = toggleChildren(d);
  // // console.info(d, relationType);
  // if (relationType === assetRelationType.INFLOW) {
  //   // console.info(inflowRoot);
  //   update(inflowRoot, d, relationType);
  // } else if (relationType === assetRelationType.OUTFLOW) {
  //   // console.info(outflowRoot);
  //   update(outflowRoot, d, relationType);
  // }
  // setTimeout(() => {
  //   centerNode(d);
  // }, 1000);
}

export default function relatedAssetsGraph(dom, props) {
  const treeDiagramData = Object.assign({}, props.relatedAssetsData);
  // console.info(props, treeDiagramData);
  // size of the diagram
  viewerWidth = props.width;
  viewerHeight = props.height;
  onAssetNodeClick = props.onAssetNodeClick;

  tree = tree.size([viewerHeight, viewerWidth]);
  // define the baseSvg, attaching a class for styling and the zoomListener
  const svg = d3.select('svg');
  svg && svg.remove();
  baseSvg = d3.select(dom).append('svg');
  baseSvg
    .attr('width', viewerWidth)
    .attr('height', viewerHeight)
    .attr('class', 'overlay')
    .call(zoomListener);

  // Append a group which holds all nodes and which the zoom Listener can act upon.
  svgGroup = baseSvg
    .append('g')
    .attr('class', 'flows')
    .attr('transform', 'translate(0, 0)');
  inflowSVGGroup = svgGroup.append('g').attr('class', 'flow in');
  outflowSVGGroup = svgGroup.append('g').attr('class', 'flow out');
  // Define the root
  inflowRoot = constructTreeData(assetRelationType.INFLOW, treeDiagramData);
  outflowRoot = constructTreeData(assetRelationType.OUTFLOW, treeDiagramData);
  inflowRoot.x0 = 0;
  inflowRoot.y0 = 0;
  outflowRoot.x0 = 0;
  outflowRoot.y0 = 0;
  // console.info(inflowRoot, outflowRoot);
  // Layout the tree initially and center on the root node.
  if (inflowRoot && inflowRoot.children) {
    update(inflowRoot, inflowRoot, assetRelationType.INFLOW, true);
    setTimeout(() => {
      centerNode(inflowRoot);
    }, 1000);
  }
  if (outflowRoot && outflowRoot.children) {
    update(outflowRoot, outflowRoot, assetRelationType.OUTFLOW, true);
    setTimeout(() => {
      centerNode(outflowRoot);
    }, 1000);
  }
}

function update(root, source, relationType, firstTime) {
  let nodeIndex = 0;
  root = Object.assign({}, root);
  source = Object.assign({}, source);
  const svgGroup = relationType === assetRelationType.INFLOW
    ? inflowSVGGroup
    : outflowSVGGroup;
  const orientations = {
    [assetRelationType.INFLOW]: {
      // left-to-right
      size: [viewerHeight, viewerWidth],
      x: function(d) {
        return viewerWidth / 2 - d.y;
      },
      y: function(d) {
        return d.x;
      },
    },
    [assetRelationType.OUTFLOW]: {
      // right-to-left
      size: [viewerHeight, viewerWidth],
      x: function(d) {
        return viewerWidth / 2 + d.y;
      },
      y: function(d) {
        return d.x;
      },
    },
  };
  const orientation = orientations[relationType];
  // define a d3 diagonal projection for use by the node paths later on.
  const diagonal = d3.svg
    .diagonal()
    .projection(d => [orientation.x(d), orientation.y(d)]);
  // Compute the new height, function counts total children of root node and sets tree height accordingly.
  // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
  // This makes the layout more consistent.
  let levelWidth = [1];
  let childCount = function(level, n) {
    if (n.children && n.children.length > 0) {
      if (levelWidth.length <= level + 1) levelWidth.push(0);

      levelWidth[level + 1] += n.children.length;
      n.children.forEach(function(d) {
        childCount(level + 1, d);
      });
    }
  };
  childCount(0, root);
  let newHeight = d3.max(levelWidth) * 225; // 25 pixels per line
  tree = tree.size([newHeight, viewerWidth]);

  // Compute the new tree layout.
  let nodes = tree.nodes(root);
  let links = tree.links(nodes);
  // Set widths between levels based on maxLabelLength.
  nodes.forEach(function(d) {
    d.y = d.depth * (15 * 10); //maxLabelLength * 10px
    // alternatively to keep a fixed scale one can set a fixed depth per level
    // Normalize for fixed-depth by commenting out below line
    // d.y = (d.depth * 500); //500px per level.
  });

  // Update the nodes
  const node = svgGroup.selectAll('g.node').data(nodes, function(d) {
    return d.id || (d.id = ++nodeIndex);
  });

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', function(d) {
      const className = `${relationType === assetRelationType.INFLOW ? 'in node' : 'out node'}`;
      return d._id === root._id ? `${className} root` : 'node';
    })
    .attr('transform', function(d) {
      // console.info('enter source, d:', source, d);
      return 'translate(' + source.y0 + ',' + source.x0 + ')';
    });

  const rectWidth = 200;
  const rectHeight = 70;

  nodeEnter
    .filter(function(d) {
      return d.type === nodeTypes.DATASET;
    })
    .append('rect')
    .attr('class', 'nodeRect')
    .attr('width', rectWidth)
    .attr('height', rectHeight);

  nodeEnter
    .filter(function(d) {
      return d.type !== nodeTypes.DATASET;
    })
    .append('circle')
    .attr('class', 'nodeCircle')
    .attr('r', 35);

  nodeEnter
    .filter(function(d) {
      return d.type !== nodeTypes.GROUP;
    })
    .on('click', click.bind(this, relationType));

  nodeEnter
    .append('text')
    .attr('x', function(d) {
      if (d.type === nodeTypes.GROUP) {
        return 6;
      } else if (d.type === nodeTypes.DATASET) {
        return 16;
      }
      return d.children || d._children ? 16 : 10;
    })
    .attr('dy', function(d) {
      if (d.type === nodeTypes.DATASET) {
        return '1.5em';
      } else if (d.type === nodeTypes.GROUP) {
        return '.35em';
      }
      return '-3em';
    })
    .attr('class', 'nodeText')
    .attr('text-anchor', function(d) {
      if (d.type === nodeTypes.DATASET) {
        return 'start';
      }
      return d.children || d._children ? 'middle' : 'middle';
    })
    .text(function(d) {
      if (d.type === nodeTypes.GROUP) {
        // console.info('d', d);
        if (d.children) {
          return d.children.length.toString();
        }
        return d._children.length.toString();
      }
      return d.name;
    })
    .style('fill', function(d) {
      if (d.type === nodeTypes.GROUP) {
        return d._children ? '#444' : colors[d.children[0].type].fill;
      }
      return '#444';
    })
    .style('font-size', 16);

  nodeEnter
    .filter(function(d) {
      return d.type === nodeTypes.GROUP;
    })
    .append('text')
    .attr('dy', '-45')
    .attr('class', 'nodeText-top')
    .attr('text-anchor', function(d) {
      return d.children || d._children ? 'middle' : 'middle';
    })
    .text(function(d) {
      if (d.children) {
        return d.children[0].type;
      }
      return d._children[0].type;
    })
    .style('fill', function(d) {
      if (d.children) {
        return colors[d.children[0].type].fill;
      }
      return colors[d._children[0].type].fill;
    })
    .style('font-size', 20);

  // Update the text to reflect whether node has children or not.
  node.select('text').style('fill', function(d) {
    // console.info('d', d)
    if (!d.children && !d._children) {
      return '#444';
    }
    if (d.children) {
      return d.type === nodeTypes.GROUP
        ? colors[d.children[0].type].fill
        : '#444';
    }
    return '#fff';
  });

  // Change the circle fill depending on whether it has children and is collapsed
  node
    .select('circle.nodeCircle')
    .style('fill', function(d) {
      if (d._children && d.type === nodeTypes.GROUP) {
        // console.info('d', d);
        return colors[d._children[0].type].fill;
      }
      return d._children ? colors[d.type].fill : '#fff';
    })
    .style('stroke', function(d) {
      if (d._children && d.type === nodeTypes.GROUP) {
        return colors[d._children[0].type].border;
      }
      return d._children ? colors[d.type].border : '#fff';
    });

  node
    .select('rect.nodeRect')
    .attr('rx', 3)
    .style('fill', function(d) {
      return d._children ? colors[d.type].fill : '#fff';
    })
    .style('stroke', function(d) {
      return d._children ? colors[d.type].border : '#fff';
    });

  // Transition nodes to their new position.
  let nodeUpdate = node
    .transition()
    .duration(duration)
    .attr('transform', function(d, i) {
      // console.info('update source, d:', source, d);
      if (d.type === nodeTypes.DATASET) {
        const newRectPosition = relationType === assetRelationType.INFLOW
          ? orientation.x(d) - rectWidth
          : orientation.x(d);
        if (d._id === root._id) {
          if (
            inflowRoot &&
            inflowRoot.children &&
            outflowRoot &&
            outflowRoot.children
          ) {
            return `translate(${relationType === assetRelationType.INFLOW ? newRectPosition + rectWidth / 2 : newRectPosition - rectWidth / 2}, ${orientation.y(d) - 35})`;
          } else if (inflowRoot && inflowRoot.children) {
            return `translate(${newRectPosition + rectWidth}, ${orientation.y(d) - 35})`;
          } else if (outflowRoot && outflowRoot.children) {
            return `translate(${newRectPosition - rectWidth}, ${orientation.y(d) - 35})`;
          }
        }
        return `translate(${newRectPosition}, ${orientation.y(d) - 35})`;
      }
      return `translate(${orientation.x(d)}, ${orientation.y(d)})`;
    });

  // Fade the text in
  nodeUpdate.select('text').style('fill-opacity', 1);
  nodeUpdate.select('circle').attr('r', 35);
  nodeUpdate.select('rect').attr('width', rectWidth).attr('height', rectHeight);

  // Transition exiting nodes to the parent's new position.
  let nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      // console.info('exit source, d:', source, d);
      return 'translate(' + source.y0 + ',' + source.x0 + ')';
    })
    .remove();

  nodeExit.select('circle').attr('r', 0);
  nodeExit.select('rect').attr('width', 0).attr('height', 0);

  nodeExit.select('text').style('fill-opacity', 0);

  let link = svgGroup
    .selectAll('path.link')
    /* the code below removes paths using duplicate target id
    .data(links, function(d) {
        return d.target.id;
    });
    */
    .data(links);
  // console.info(link);

  // Enter any new links at the parent's previous position.
  link.enter().insert('path', 'g').attr('class', 'link').attr('d', function(d) {
    let o = {
      x: source.x0,
      y: source.y0,
    };
    return diagonal({
      source: o,
      target: o,
    });
  });

  // Transition links to their new position.
  link.transition().duration(duration).attr('d', diagonal);

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      let o = {
        x: source.x,
        y: source.y,
      };
      return diagonal({
        source: o,
        target: o,
      });
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
    // if (d.type === nodeTypes.GROUP && firstTime) {
    //   d = toggleChildren(d);
    //   update(d);
    //   centerNode(d);
    // }
  });

  if (assetRelationType.INFLOW === relationType) {
    inflowTreeHeight = newHeight;
  } else {
    outflowTreeHeight = newHeight;
  }
}
