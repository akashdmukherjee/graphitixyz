var treeData = [
  {
    name: 'Device',
    parent: 'null',
  },
];
var treeData2 = [
  {
    name: 'Device',
    parent: 'null',
  },
];
export default function relatedAssetsGraph(
  dom,
  props
) {
  var margin = {
    top: 20,
    right: 120,
    bottom: 20,
    left: 120,
  },
    width = 1260 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

  var i = 0, duration = 750, root;

  var tree = d3.layout
    .tree()
    .size([height, width]);

  var diagonal = d3.svg
    .diagonal()
    .projection(function(d) {
      return [d.y, d.x];
    });

  var svg = d3
    .select(dom)
    .append('svg')
    .attr(
      'width',
      width + margin.right + margin.left
    )
    .attr(
      'height',
      height + margin.top + margin.bottom
    );

  makeRightTree();
  makeLeftTree();
}

function makeRightTree() {
  // ************** Generate the tree diagram  *****************
  var margin = {
    top: 20,
    right: 120,
    bottom: 20,
    left: 120,
  },
    width = 1260 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

  var i = 0, duration = 750, root;

  var tree = d3.layout
    .tree()
    .size([height, width]);

  var diagonal = d3.svg
    .diagonal()
    .projection(function(d) {
      return [d.y, d.x];
    });

  var svg = d3
    .select('svg')
    .append('g')
    .attr('transform', 'translate(600,0)');

  root = treeData[0];
  const oldrx = (root.x0 = height / 2);
  const oldry = (root.y0 = 0);

  update(root);

  function update(source) {
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.y = d.depth * 180;
    });

    // Update the nodes…
    var node = svg
      .selectAll('g.node')
      .data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node
      .enter()
      .append('g')
      .attr('class', function(d) {
        if (d.parent == 'null') {
          return 'node rightparent'; //since its root its parent is null
        } else return 'node rightchild'; //all nodes with parent will have this class
      })
      .attr('transform', function(d) {
        return (
          'translate(' +
          source.y0 +
          ',' +
          source.x0 +
          ')'
        );
      })
      .on('click', click);

    nodeEnter
      .append('rect')
      .attr('x', '-10')
      .attr('y', '-15')
      .attr('height', 30)
      .attr('width', 100)
      .attr('rx', 15)
      .attr('ry', 15)
      .style('fill', '#f1f1f1');

    nodeEnter
      .append('text')
      .attr('x', function(d) {
        return d.children || d._children
          ? -13
          : 13;
      })
      .attr('dy', '.35em')
      .attr('text-anchor', function(d) {
        return d.children || d._children
          ? 'end'
          : 'start';
      })
      .text(function(d) {
        return d.name;
      })
      .style('fill-opacity', 1e-6);

    var addRightChild = nodeEnter.append('g');
    addRightChild
      .append('rect')
      .attr('x', '90')
      .attr('y', '-10')
      .attr('height', 20)
      .attr('width', 20)
      .attr('rx', 10)
      .attr('ry', 10)
      .style('stroke', '#444')
      .style('stroke-width', '2')
      .style('fill', '#ccc');

    addRightChild
      .append('line')
      .attr('x1', 95)
      .attr('y1', 1)
      .attr('x2', 105)
      .attr('y2', 1)
      .attr('stroke', '#444')
      .style('stroke-width', '2');

    addRightChild
      .append('line')
      .attr('x1', 100)
      .attr('y1', -4)
      .attr('x2', 100)
      .attr('y2', 6)
      .attr('stroke', '#444')
      .style('stroke-width', '2');

    // Transition nodes to their new position.
    var nodeUpdate = node
      .transition()
      .duration(duration)
      .attr('transform', function(d) {
        if (d.parent == 'null') {
          d.y = oldry;
          d.x = oldrx;
        }

        return (
          'translate(' + d.y + ',' + d.x + ')'
        );
      });

    nodeUpdate
      .select('circle')
      .attr('r', 10)
      .style('fill', function(d) {
        return d._children
          ? 'lightsteelblue'
          : '#fff';
      });

    nodeUpdate
      .select('text')
      .style('fill-opacity', 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr('transform', function(d) {
        return (
          'translate(' +
          source.y +
          ',' +
          source.x +
          ')'
        );
      })
      .remove();

    nodeExit.select('circle').attr('r', 1e-6);

    nodeExit
      .select('text')
      .style('fill-opacity', 1e-6);

    // Update the links…
    var link = svg
      .selectAll('path.link')
      .data(links, function(d) {
        return d.target.id;
      });

    // Enter any new links at the parent's previous position.
    link
      .enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', function(d) {
        var o = {
          x: source.x0,
          y: source.y0,
        };
        return diagonal({
          source: o,
          target: o,
        });
      })
      .on('click', removelink);

    function removelink(d) {
      //this is the links target node which you want to remove
      var target = d.target;
      //make new set of children
      var children = [];
      //iterate through the children
      target.parent.children.forEach(function(
        child
      ) {
        if (child.id != target.id) {
          //add to teh child list if target id is not same
          //so that the node target is removed.
          children.push(child);
        }
      });
      //set the target parent with new set of children sans the one which is removed
      target.parent.children = children;
      //redraw the parent since one of its children is removed
      update(d.target.parent);
    }

    // Transition links to their new position.
    link
      .transition()
      .duration(duration)
      .attr('d', diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {
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
    });

    addRightChild.on('click', function(d) {
      event.stopPropagation();
      const childInfo = document.getElementById(
        'child-info'
      );
      const childText = document.getElementById(
        'child-text'
      );
      const btnAddChild = document.getElementById(
        'btn-add-child'
      );
      childInfo.style.display = 'block';
      childText.textContent = '';
      // $('#child-info').show();
      // $('#child-text').val('');
      btnAddChild.removeEventListener('click', null);
      btnAddChild.addEventListener(
        'click',
        function() {
          var childname = childText.textContent;

          if (typeof d.children === 'undefined') {
            var newChild = [
              {
                name: childname,
                parent: 'Son Of A',
              },
            ];

            console.log(tree.nodes(newChild[0]));
            var newnodes = tree.nodes(newChild);
            d.children = newnodes[0];
            console.log(d.children);
            update(d);
          } else {
            var newChild = {
              name: childname,
              parent: 'Son Of A',
            };
            console.log(d.children);
            d.children.push(newChild);
            console.log(d.children);
            update(d);
          }

          childInfo.style.display = 'none';
        }
      );
    });
  }

  // Toggle children on click.
  function click(d) {
    // console.log(d);
    // if (d.children) {
    //  d._children = d.children;
    //  d.children = null;
    // } else {
    //  d.children = d._children;
    //  d._children = null;
    // }
    // update(d);
  }
}

function makeLeftTree() {
  // ************** Generate the tree diagram  *****************
  var margin = {
    top: 20,
    right: 120,
    bottom: 20,
    left: 120,
  },
    width = 1260 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

  var i = 0, duration = 750, root;

  var tree = d3.layout
    .tree()
    .size([height, width]);

  var diagonal = d3.svg
    .diagonal()
    .projection(function(d) {
      return [d.y, d.x];
    });

  var svg = d3
    .select('svg')
    .append('g')
    .attr('transform', 'translate(-421,0)');

  root = treeData2[0];
  const oldlx = (root.x0 = height / 2);
  const oldly = (root.y0 = width);

  update(root);

  function update(source) {
    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.y = width - d.depth * 180;
    });

    // Update the nodes…
    var node = svg
      .selectAll('g.node')
      .data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node
      .enter()
      .append('g')
      .attr('class', function(d) {
        if (d.parent == 'null') {
          return 'node leftparent'; //since its root its parent is null
        } else return 'node leftchild'; //all nodes with parent will have this class
      })
      .attr('transform', function(d) {
        return (
          'translate(' +
          source.y0 +
          ',' +
          source.x0 +
          ')'
        );
      })
      .on('click', click);

    nodeEnter
      .append('rect')
      .attr('x', '-10')
      .attr('y', '-15')
      .attr('height', 30)
      .attr('width', 100)
      .attr('rx', 15)
      .attr('ry', 15)
      .style('fill', '#f1f1f1');

    nodeEnter
      .append('text')
      .attr('x', function(d) {
        return d.children || d._children
          ? -13
          : 13;
      })
      .attr('dy', '.35em')
      .attr('text-anchor', function(d) {
        return d.children || d._children
          ? 'end'
          : 'start';
      })
      .text(function(d) {
        return d.name;
      })
      .style('fill-opacity', 1e-6);

    var addLeftChild = nodeEnter.append('g');
    addLeftChild
      .append('rect')
      .attr('x', '-30')
      .attr('y', '-10')
      .attr('height', 20)
      .attr('width', 20)
      .attr('rx', 10)
      .attr('ry', 10)
      .style('stroke', '#444')
      .style('stroke-width', '2')
      .style('fill', '#ccc');

    addLeftChild
      .append('line')
      .attr('x1', -25)
      .attr('y1', 1)
      .attr('x2', -15)
      .attr('y2', 1)
      .attr('stroke', '#444')
      .style('stroke-width', '2');

    addLeftChild
      .append('line')
      .attr('x1', -20)
      .attr('y1', -4)
      .attr('x2', -20)
      .attr('y2', 6)
      .attr('stroke', '#444')
      .style('stroke-width', '2');

    // Transition nodes to their new position.
    var nodeUpdate = node
      .transition()
      .duration(duration)
      .attr('transform', function(d) {
        if (d.parent == 'null') {
          d.y = oldly;
          d.x = oldlx;
        }
        return (
          'translate(' + d.y + ',' + d.x + ')'
        );
      });

    nodeUpdate
      .select('circle')
      .attr('r', 10)
      .style('fill', function(d) {
        return d._children
          ? 'lightsteelblue'
          : '#fff';
      });

    nodeUpdate
      .select('text')
      .style('fill-opacity', 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr('transform', function(d) {
        return (
          'translate(' +
          source.y +
          ',' +
          source.x +
          ')'
        );
      })
      .remove();

    nodeExit.select('circle').attr('r', 1e-6);

    nodeExit
      .select('text')
      .style('fill-opacity', 1e-6);

    // Update the links…
    var link = svg
      .selectAll('path.link')
      .data(links, function(d) {
        return d.target.id;
      });

    // Enter any new links at the parent's previous position.
    link
      .enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', function(d) {
        var o = {
          x: source.x0,
          y: source.y0,
        };
        return diagonal({
          source: o,
          target: o,
        });
      })
      .on('click', removelink);

    function removelink(d) {
      //this is the links target node which you want to remove
      var target = d.target;
      //make new set of children
      var children = [];
      //iterate through the children
      target.parent.children.forEach(function(
        child
      ) {
        if (child.id != target.id) {
          //add to teh child list if target id is not same
          //so that the node target is removed.
          children.push(child);
        }
      });
      //set the target parent with new set of children sans the one which is removed
      target.parent.children = children;
      //redraw the parent since one of its children is removed
      update(d.target.parent);
    }

    // Transition links to their new position.
    link
      .transition()
      .duration(duration)
      .attr('d', diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {
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
    });

    addLeftChild.on('click', function(d) {
      event.stopPropagation();
      const childInfo = document.getElementById(
        'child-info'
      );
      const childText = document.getElementById(
        'child-text'
      );
      const btnAddChild = document.getElementById(
        'btn-add-child'
      );
      childInfo.style.display = 'block';
      childText.textContent = '';
      // $('#child-info').show();
      // $('#child-text').val('');
      btnAddChild.removeEventListener('click', null);
      btnAddChild.addEventListener(
        'click',
        function() {
          var childname = childText.textContent;

          if (typeof d.children === 'undefined') {
            var newChild = [
              {
                name: childname,
                parent: 'Son Of A',
              },
            ];

            //console.log(tree.nodes(newChild[0]));
            var newnodes = tree.nodes(newChild);
            d.children = newnodes[0];
            console.log(d.children);
            update(d);
          } else {
            var newChild = {
              name: childname,
              parent: 'Son Of A',
            };
            console.log(d.children);
            d.children.push(newChild);
            console.log(d.children);
            update(d);
          }
          childInfo.css.display = 'none';
        }
      );
    });
  }

  // Toggle children on click.
  function click(d) {
    // console.log(d);
    // if (d.children) {
    //  d._children = d.children;
    //  d.children = null;
    // } else {
    //  d.children = d._children;
    //  d._children = null;
    // }
    // update(d);
  }
}
