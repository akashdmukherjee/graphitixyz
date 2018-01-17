import d3 from 'd3';
import treeDiagramDataSmall from './treeDiagramDataSmall';

const nodeTypes = {
  Group: 'Group',
  Dataset: 'Dataset',
};

const colors = {
  SQL: {
    fill: '#00BD9C',
    border: '#48CDB5',
  },
  Group: {
    fill: '#ec0b43',
    border: '#f63465',
  },
  Dataset: {
    fill: '#2D96DE',
    border: '#5EAEE6',
  },
  Chart: {
    fill: '#9C55B8',
    border: '#B27BC8',
  },
};

export default function drawTreeDiagram(dom, props) {
  // console.info(treeDiagramData);
  // Calculate total nodes, max label length
  const treeDiagramData = treeDiagramDataSmall;
  let totalNodes = 0;
  let maxLabelLength = 0;
  // variables for drag/drop
  let selectedNode = null;
  let draggingNode = null;
  // panning variables
  const panSpeed = 200;
  const panBoundary = 20; // Within 20px from edges will pan when dragging.
  // Misc. variables
  const duration = 750;
  let nodeIndex = 0;
  let scale;
  let node;
  let x;
  let y;
  let svgGroup;

  // size of the diagram
  const viewerWidth = props.width;
  const viewerHeight = props.height;

  let tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

  // define a d3 diagonal projection for use by the node paths later on.
  const diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

  // A recursive helper function for performing some setup by walking through all nodes

  function visit(parent, visitFn, childrenFn) {
    if (!parent) return;

    visitFn(parent);

    const children = childrenFn(parent);
    if (children) {
      const count = children.length;
      for (let i = 0; i < count; i++) {
        visit(children[i], visitFn, childrenFn);
      }
    }
  }

  // Call visit function to establish maxLabelLength
  visit(
    treeDiagramData,
    d => {
      totalNodes++;
      maxLabelLength = Math.max(d.name.length, maxLabelLength);
    },
    d => {
      return d.children && d.children.length > 0 ? d.children : null;
    }
  );

  // sort the tree according to the node names
  // function sortTree() {
  //     tree.sort(function (a, b) {
  //         return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
  //     });
  // }
  // // Sort the tree initially incase the JSON isn't in a sorted order.
  // sortTree();

  // Define the zoom function for the zoomable tree
  // define the zoomListener which calls the zoom function
  // on the 'zoom' event constrained within the scaleExtents
  function zoom() {
    svgGroup.attr(
      'transform',
      `translate(${d3.event.translate}) scale(${d3.event.scale})`
    );
  }

  const zoomListener = d3.behavior
    .zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', zoom);

  // TODO: Pan function, can be better implemented.
  const pan = (domNode, direction) => {
    const speed = panSpeed;
    const panTimer = setTimeout(() => {
      pan(domNode, speed, direction);
    }, 50);
    if (panTimer) {
      clearTimeout(panTimer);
      const translateCoords = d3.transform(svgGroup.attr('transform'));
      let translateX;
      let translateY;
      if (direction === 'left' || direction === 'right') {
        translateX = direction == 'left'
          ? translateCoords.translate[0] + speed
          : translateCoords.translate[0] - speed;
        translateY = translateCoords.translate[1];
      } else if (direction === 'up' || direction === 'down') {
        translateX = translateCoords.translate[0];
        translateY = direction == 'up'
          ? translateCoords.translate[1] + speed
          : translateCoords.translate[1] - speed;
      }
      scale = zoomListener.scale();
      svgGroup
        .transition()
        .attr(
          'transform',
          'translate(' + translateX + ',' + translateY + ')scale(' + scale + ')'
        );
      d3
        .select(domNode)
        .select('g.node')
        .attr('transform', 'translate(' + translateX + ',' + translateY + ')');
      zoomListener.scale(zoomListener.scale());
      zoomListener.translate([translateX, translateY]);
    }
  };

  function initiateDrag(d, domNode) {
    draggingNode = d;
    d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
    d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
    d3.select(domNode).attr('class', 'node activeDrag');

    svgGroup.selectAll('g.node').sort(function(a, b) {
      // select the parent and sort the path's
      if (a.id != draggingNode.id)
        return 1; // a is not the hovered element, send 'a' to the back
      else return -1; // a is the hovered element, bring 'a' to the front
    });
    // if nodes has children, remove the links and nodes
    if (nodes.length > 1) {
      // remove link paths
      links = tree.links(nodes);
      nodePaths = svgGroup
        .selectAll('path.link')
        .data(links, function(d) {
          return d.target.id;
        })
        .remove();
      // remove child nodes
      nodesExit = svgGroup
        .selectAll('g.node')
        .data(nodes, function(d) {
          return d.id;
        })
        .filter(function(d, i) {
          if (d.id == draggingNode.id) {
            return false;
          }
          return true;
        })
        .remove();
    }

    // remove parent link
    parentLink = tree.links(tree.nodes(draggingNode.parent));
    svgGroup
      .selectAll('path.link')
      .filter(function(d, i) {
        if (d.target.id == draggingNode.id) {
          return true;
        }
        return false;
      })
      .remove();

    dragStarted = null;
  }

  // define the baseSvg, attaching a class for styling and the zoomListener
  const baseSvg = d3
    .select(dom)
    .append('svg')
    .attr('width', viewerWidth)
    .attr('height', viewerHeight)
    .attr('class', 'overlay')
    .call(zoomListener);

  // Define the drag listeners for drag/drop behaviour of nodes.
  const dragListener = d3.behavior
    .drag()
    .on('dragstart', function(d) {
      if (d == root) {
        return;
      }
      dragStarted = true;
      nodes = tree.nodes(d);
      d3.event.sourceEvent.stopPropagation();
      // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
    })
    .on('drag', function(d) {
      if (d == root) {
        return;
      }
      if (dragStarted) {
        domNode = this;
        initiateDrag(d, domNode);
      }
      // get coords of mouseEvent relative to svg container to allow for panning
      const relCoords = d3.mouse($('svg').get(0));
      if (relCoords[0] < panBoundary) {
        panTimer = true;
        pan(this, 'left');
      } else if (relCoords[0] > $('svg').width() - panBoundary) {
        panTimer = true;
        pan(this, 'right');
      } else if (relCoords[1] < panBoundary) {
        panTimer = true;
        pan(this, 'up');
      } else if (relCoords[1] > $('svg').height() - panBoundary) {
        panTimer = true;
        pan(this, 'down');
      } else {
        try {
          clearTimeout(panTimer);
        } catch (e) {}
      }
      d.x0 += d3.event.dy;
      d.y0 += d3.event.dx;
      node = d3.select(this);
      node.attr('transform', 'translate(' + d.y0 + ',' + d.x0 + ')');
      updateTempConnector();
    })
    .on('dragend', function(d) {
      if (d == root) {
        return;
      }
      domNode = this;
      if (selectedNode) {
        // now remove the element from the parent, and insert it into the new elements children
        let index = draggingNode.parent.children.indexOf(draggingNode);
        if (index > -1) {
          draggingNode.parent.children.splice(index, 1);
        }
        if (
          typeof selectedNode.children !== 'undefined' ||
          typeof selectedNode._children !== 'undefined'
        ) {
          if (typeof selectedNode.children !== 'undefined') {
            selectedNode.children.push(draggingNode);
          } else {
            selectedNode._children.push(draggingNode);
          }
        } else {
          selectedNode.children = [];
          selectedNode.children.push(draggingNode);
        }
        // Make sure that the node being added to is expanded so user can see added node is correctly moved
        expand(selectedNode);
        sortTree();
        endDrag();
      } else {
        endDrag();
      }
    });

  function endDrag() {
    selectedNode = null;
    d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
    d3.select(domNode).attr('class', 'node');
    // now restore the mouseover event or we won't be able to drag a 2nd time
    d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
    updateTempConnector();
    if (draggingNode !== null) {
      update(root);
      centerNode(draggingNode);
      draggingNode = null;
    }
  }

  // Helper functions for collapsing and expanding nodes.
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function expand(d) {
    if (d._children) {
      d.children = d._children;
      d.children.forEach(expand);
      d._children = null;
    }
  }

  let overCircle = function(d) {
    selectedNode = d;
    updateTempConnector();
  };
  let outCircle = function(d) {
    selectedNode = null;
    updateTempConnector();
  };

  // Function to update the temporary connector indicating dragging affiliation
  let updateTempConnector = function() {
    let data = [];
    if (draggingNode !== null && selectedNode !== null) {
      // have to flip the source coordinates since we did this for the existing connectors on the original tree
      data = [
        {
          source: {
            x: selectedNode.y0,
            y: selectedNode.x0,
          },
          target: {
            x: draggingNode.y0,
            y: draggingNode.x0,
          },
        },
      ];
    }
    let link = svgGroup.selectAll('.templink').data(data);

    link
      .enter()
      .append('path')
      .attr('class', 'templink')
      .attr('d', d3.svg.diagonal())
      .attr('pointer-events', 'none');

    link.attr('d', d3.svg.diagonal());

    link.exit().remove();
  };

  // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
  function centerNode(source) {
    scale = zoomListener.scale();
    x = -source.y0;
    y = -source.x0;
    x = x * scale + viewerWidth / 2;
    y = y * scale + viewerHeight / 2;
    d3
      .select('g')
      .transition()
      .duration(duration)
      .attr('transform', `translate(${x}, ${y})scale(${scale})`);
    zoomListener.scale(scale);
    zoomListener.translate([x, y]);
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
  function click(d) {
    if (d3.event.defaultPrevented) return; // click suppressed
    d = toggleChildren(d);
    update(d);
    centerNode(d);
  }

  function update(source, firstTime) {
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
    let nodes = tree.nodes(root).reverse(), links = tree.links(nodes);
    // console.info(links);

    const linksNode = {};
    links.forEach(link => {
      const source = link.source;
      const target = link.target;
      if (!linksNode[source.name]) {
        linksNode[source.name] = source;
      }
      if (!linksNode[target.name]) {
        linksNode[target.name] = target;
      }
    });
    // console.info(linksNode);
    // Set widths between levels based on maxLabelLength.
    nodes.forEach(function(d) {
      d.y = d.depth * (maxLabelLength * 10); //maxLabelLength * 10px
      // alternatively to keep a fixed scale one can set a fixed depth per level
      // Normalize for fixed-depth by commenting out below line
      // d.y = (d.depth * 500); //500px per level.
    });

    // Update the nodes…
    node = svgGroup.selectAll('g.node').data(nodes, function(d) {
      return d.id || (d.id = ++nodeIndex);
    });

    // Enter any new nodes at the parent's previous position.
    let nodeEnter = node
      .enter()
      .append('g')
      .call(dragListener)
      .attr('class', 'node')
      .attr('transform', function(d) {
        // console.info('enter source, d:', source, d);
        return 'translate(' + source.y0 + ',' + source.x0 + ')';
      })
      .on('click', click);

    const rectWidth = 200;
    const rectHeight = 70;

    nodeEnter
      .filter(function(d) {
        return d.node_type === nodeTypes.Dataset;
      })
      .append('rect')
      .attr('class', 'nodeRect')
      .attr('width', rectWidth)
      .attr('height', rectHeight);

    nodeEnter
      .filter(function(d) {
        return d.node_type !== nodeTypes.Dataset;
      })
      .append('circle')
      .attr('class', 'nodeCircle')
      .attr('r', 35);
    // .on('mouseenter', function(node) {
    //   // console.info(node);
    //   if (node._children) {
    //     d3.select(this).transition()
    //       .duration(750)
    //       .style('stroke', colors[node._children[0].node_type].fill);
    //   }
    // })
    // .on('mouseleave', function(node) {
    //   // console.info(node);
    //   if (node._children) {
    //     d3.select(this).transition()
    //       .duration(750)
    //       .style('stroke', colors[node._children[0].node_type].border);
    //   }
    // });

    nodeEnter
      .append('text')
      .attr('x', function(d) {
        if (d.node_type === nodeTypes.Group) {
          return 8;
        } else if (d.node_type === nodeTypes.Dataset) {
          return 16;
        }
        return d.children || d._children ? 16 : 10;
      })
      .attr('dy', function(d) {
        if (d.node_type === nodeTypes.Dataset) {
          return '1.5em';
        }
        return '.35em';
      })
      .attr('class', 'nodeText')
      .attr('text-anchor', function(d) {
        if (d.node_type === nodeTypes.Dataset) {
          return 'start';
        }
        return d.children || d._children ? 'end' : 'start';
      })
      .text(function(d) {
        if (d.node_type === nodeTypes.Group) {
          // console.info('d', d);
          if (d.children) {
            return d.children.length.toString();
          }
          return d._children.length.toString();
        }
        return d.name;
      })
      .style('fill', function(d) {
        if (d.node_type === nodeTypes.Group) {
          return d._children ? '#444' : colors[d.children[0].node_type].fill;
        }
        return '#444';
      })
      .style('font-size', 16);

    nodeEnter
      .filter(function(d) {
        return d.node_type === nodeTypes.Group;
      })
      .append('text')
      .attr('dy', '-45')
      .attr('class', 'nodeText-top')
      .attr('text-anchor', function(d) {
        return d.children || d._children ? 'middle' : 'middle';
      })
      .text(function(d) {
        if (d.children) {
          return d.children[0].node_type;
        }
        return d._children[0].node_type;
      })
      .style('fill', function(d) {
        if (d.children) {
          return colors[d.children[0].node_type].fill;
        }
        return colors[d._children[0].node_type].fill;
      })
      .style('font-size', 20);

    // Update the text to reflect whether node has children or not.
    node.select('text').style('fill', function(d) {
      // console.info('d', d)
      if (!d.children && !d._children) {
        return '#444';
      }
      if (d.children) {
        return d.node_type === nodeTypes.Group
          ? colors[d.children[0].node_type].fill
          : '#444';
      }
      return '#fff';
    });

    // Change the circle fill depending on whether it has children and is collapsed
    node
      .select('circle.nodeCircle')
      .style('fill', function(d) {
        if (d._children && d.node_type === nodeTypes.Group) {
          // console.info('d', d);
          return colors[d._children[0].node_type].fill;
        }
        return d._children ? colors[d.node_type].fill : '#fff';
      })
      .style('stroke', function(d) {
        if (d._children && d.node_type === nodeTypes.Group) {
          return colors[d._children[0].node_type].border;
        }
        return d._children ? colors[d.node_type].border : '#fff';
      });

    node
      .select('rect.nodeRect')
      .attr('rx', 3)
      .style('fill', function(d) {
        return d._children ? colors[d.node_type].fill : '#fff';
      })
      .style('stroke', function(d) {
        return d._children ? colors[d.node_type].border : '#fff';
      });

    // Transition nodes to their new position.
    let nodeUpdate = node
      .transition()
      .duration(duration)
      .attr('transform', function(d, i) {
        // console.info('update source, d:', source, d);
        if (d.node_type === nodeTypes.Dataset) {
          if (d.name === 'Employees Asset 1') {
            // TODO: look into this
            // handle root node
            //  console.info('root node', i, d);
            return `translate(${d.y - rectWidth}, ${d.x - 35})`;
          }
          return `translate(${d.y}, ${d.x - 35})`;
        }
        return 'translate(' + d.y + ',' + d.x + ')';
      });

    // Fade the text in
    nodeUpdate.select('text').style('fill-opacity', 1);
    nodeUpdate.select('circle').attr('r', 35);
    nodeUpdate
      .select('rect')
      .attr('width', rectWidth)
      .attr('height', rectHeight);

    // Transition exiting nodes to the parent's new position.
    let nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr('transform', function(d) {
        // console.info('exit source, d:', source, d);
        return 'translate(' + source.y + ',' + source.x + ')';
      })
      .remove();

    nodeExit.select('circle').attr('r', 0);
    nodeExit.select('rect').attr('width', 0).attr('height', 0);

    nodeExit.select('text').style('fill-opacity', 0);

    // Update the links…
    // links = [
    //   ...links,
    //   {
    //     source: linksNode['3 Users'],
    //     target: linksNode['SQL File 4'],
    //   },
    //   {
    //     source: linksNode['3 Users'],
    //     target: linksNode['Dataset 2'],
    //   },
    //   {
    //     source: linksNode['3 Users'],
    //     target: linksNode['Dataset 1'],
    //   }
    // ];
    // console.info(links);
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
    link
      .enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', function(d) {
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
      // console.info('stash source, d:', source, d);
      d.x0 = d.x;
      d.y0 = d.y;
      if (d.node_type === nodeTypes.Group && firstTime) {
        d = toggleChildren(d);
        update(d);
        centerNode(d);
      }
    });
  }

  // Append a group which holds all nodes and which the zoom Listener can act upon.
  svgGroup = baseSvg.append('g');

  // Define the root
  let root = treeDiagramData;
  root.x0 = 0;
  root.y0 = 0;

  // Layout the tree initially and center on the root node.
  update(root, true);
  centerNode(root);
}
