// This is the latest
// tree diagram for Related Assets
/*eslint-disable*/
import d3 from 'd3';

const nodeTypes = {
  DATASET: 'DATASET',
  SQL: 'SQL'
};

const assetRelationType = {
  INFLOW: 'INFLOW',
  OUTFLOW: 'OUTFLOW'
};

const fillColor = '#e5e8ea';
const strokeColor = '#f3f5f6';

const colors = {
  SQL: {
    fill: fillColor,
    border: strokeColor
  },
  GROUP: {
    fill: '#ec0b43',
    border: '#f63465'
  },
  DATASET: {
    fill: fillColor,
    border: strokeColor
  },
  CHART: {
    fill: '#9C55B8',
    border: '#B27BC8'
  }
};

const strokeWidths = {
  circle: 6,
  rect: 6,
  link: 3
};

/*var root = {
  children: [
    {
      children: [
        {
          name: 'GVDATA_Tuesday_1',
          _id: 'ce70c247-a1ce-4cc5-aa86-da2248b6f1fb',
          type: 'DATASET'
        },
        { 
          name: 'GVDATA_Tuesday_2',
          _id: 'df4fa735-4293-41f1-b9f1-f50502b39457',
          type: 'DATASET'
        },
        {
          name: 'GVDATA_Tuesday_3',
          _id: 'df4fa735-4293-41f1-b9f1-f50502b39457',
          type: 'SQL'
        }
      ],
      name: 'inflow'
    },
    {
      children: [
        {
          name: 'GVDATA_Tuesday_1_2_1_Changed',
          _id: '724d94f9-693d-4403-91a7-16ba9de0f259',
          type: 'SQL'
        },
        {
          name: 'GVDATA_Tuesday_3',
          _id: 'df4fa735-4293-41f1-b9f1-f50502b39457',
          type: 'DATASET'
        }
      ],
      name: 'outflow'
    }
  ],
  name: 'GVSQL_Tuesday_1_2_1_ROOT',
  _id: '668ecda3-20fb-4890-9f86-e2428facaa95',
  type: 'DATASET'
};*/

export default function relatedAssets(dom, props) {
  const root = Object.assign({}, props.relatedAssetsData);
  // console.info(props, treeDiagramData);
  // size of the diagram
  let width = props.width;
  let height = props.height;
  let onAssetNodeClick = props.onAssetNodeClick;

  const radiusOfCircle = 50;
  const heightOfRectangle = 50;
  const widthOfReactangle = 200;
  const paddingBetweenNameOfAssetAndBorder = 5;

  var cluster = d3.layout.cluster().size([width / 2, height / 3]);

  var svg = d3
    .select(dom)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + 0 + ')');

  var numItems = Math.round(root.children.length / 2);
  var nodePositionDictionary = {};
  var rootLeft = { children: [], name: root.name, id: root.id, type: root.type };
  var rootRight = { children: [], name: root.name, id: root.id, type: root.type };

  for (let i = 0; i < root.children.length; i++) {
    let node = root.children[i];
    if (!(i < numItems)) {
      rootRight.children.push(Object.assign({}, node));
    } else {
      if (node.name === 'outflow') {
        rootRight.children.push(Object.assign({}, node));
      } else {
        rootLeft.children.push(Object.assign({}, node));
      }
    }
  }

  var nodesRight = cluster.nodes(rootRight);

  for (let i = 0; i < nodesRight.length; i++) {
    let node = nodesRight[i];
    node.right = true;
    nodePositionDictionary[node.name + (node.parent ? node.parent.name : '')] = node;
  }

  var nodesLeft = cluster.nodes(rootLeft);

  for (let i = 0; i < nodesLeft.length; i++) {
    let node = nodesLeft[i];
    node.right = false;
    nodePositionDictionary[node.name + (node.parent ? node.parent.name : '')] = node;
  }

  // manually create nodes with their positions
  var nodes = [];
  updateNodePositions(root);

  function handleNodeClick(nodeData) {
    // console.info(nodeData);
    onAssetNodeClick(nodeData);
  }

  function updateNodePositions(n) {
    let nodePosition = nodePositionDictionary[n.name + (n.parent ? n.parent.name : '')];
    if (nodePosition) {
      n.x = nodePosition.x;
      n.y = nodePosition.y;
      n.depth = nodePosition.depth;
      nodes.push(n);
    }
    for (let i = 0; i < n.children.length; i++) {
      let node = n.children[i];
      node.parent = n;
      nodes.push(node);
      let childNodePosition =
        nodePositionDictionary[node.name + (node.parent ? node.parent.name : '')];
      if (childNodePosition) {
        node.x = childNodePosition.x;
        node.y = childNodePosition.y;
        node.depth = childNodePosition.depth;
        node.right = childNodePosition.right;
      }
      if (node.children) {
        updateNodePositions(node);
      }
    }
  }

  let diagonalRight = d3.svg.diagonal().projection(function(d) {
    return [d.y, d.x];
  });

  let diagonalLeft = d3.svg.diagonal().projection(function(d) {
    return [-d.y, d.x];
  });

  let links = cluster.links(nodes);
  let link = svg
    .selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', function(d) {
      return d.target.right || d.source.right ? diagonalRight(d) : diagonalLeft(d);
    });

  let nodesOnTheRight = svg.selectAll('g.node').data(nodesRight);

  var tip = d3
    .select('body')
    .append('div')
    .attr('class', 'tip')
    .style('position', 'absolute')
    .style('z-index', '999')
    .style('visibility', 'hidden')
    .text('a simple tooltip');
  // This is for individual nodes
  let nodeOnRight = nodesOnTheRight
    .enter()
    .append('g')
    .attr('transform', function(d) {
      if (d.right === true) {
        return 'translate(' + d.y + ',' + d.x + ')';
      } else {
        return 'translate(' + -1 * d.y + ',' + d.x + ')';
      }
    })
    .on('click', handleNodeClick)
    .on('mouseover', function(d) {
      d3
        .select('.tip')
        .style('visibility', 'visible')
        .style('top', d3.event.pageY + 'px')
        .style('left', d3.event.pageX + 'px')
        .text(d.name);
    })
    .on('mouseout', function(d) {
      d3.select('.tip').style('visibility', 'hidden');
    });

  nodeOnRight
    .filter(function(d) {
      return d.type == 'SQL';
    })
    .append('circle')
    .attr('cx', function() {
      return radiusOfCircle;
    })
    .attr('fill', colors.SQL.fill)
    .attr('stroke', colors.SQL.border)
    .attr('stroke-width', strokeWidths.circle)
    .attr('r', function(d) {
      if (d.name === 'outflow') {
        return 0;
      } else {
        return radiusOfCircle;
      }
    });

  function wrapCircle() {
    var self = d3.select(this),
      textLength = self.node().getComputedTextLength(),
      text = self.text();
    while (
      textLength > radiusOfCircle * 2 - 2 * paddingBetweenNameOfAssetAndBorder &&
      text.length > 0
    ) {
      text = text.slice(0, -1);
      self.text(text + '...');
      textLength = self.node().getComputedTextLength();
    }
  }

  nodeOnRight
    .filter(function(d) {
      return d.type == 'SQL';
    })
    .append('text')
    .attr('x', function() {
      return radiusOfCircle;
    })
    .attr('y', '0.4em')
    .attr('text-anchor', 'middle')
    .append('tspan')
    .text(function(d) {
      return d.name;
    })
    .each(wrapCircle);

  nodeOnRight
    .filter(function(d) {
      return d.type == 'DATASET';
    })
    .append('rect')
    .attr('rx', 3)
    .attr('fill', colors.DATASET.fill)
    .attr('stroke', colors.DATASET.border)
    .attr('stroke-width', strokeWidths.rect)
    .attr('x', function(d) {
      if (d.depth == 0) {
        return -1 * (widthOfReactangle / 2);
      } else {
        return 0;
      }
    })
    .attr('y', function(d) {
      return -1 * heightOfRectangle / 2;
    })
    .attr('width', widthOfReactangle)
    .attr('height', heightOfRectangle);

  function wrapRectangle() {
    var self = d3.select(this),
      textLength = self.node().getComputedTextLength(),
      text = self.text();
    while (
      textLength > widthOfReactangle - 2 * paddingBetweenNameOfAssetAndBorder &&
      text.length > 0
    ) {
      text = text.slice(0, -1);
      self.text(text + '...');
      textLength = self.node().getComputedTextLength();
    }
  }

  nodeOnRight
    .filter(function(d) {
      return d.type == 'DATASET';
    })
    .append('text')
    .attr('x', function(d) {
      if (d.type === 'DATASET' && d.depth === 0) {
        return 0;
      }
      return widthOfReactangle / 2;
    })
    .attr('y', function() {
      return 5;
    })
    .attr('text-anchor', 'middle')
    .append('tspan')
    .text(function(d) {
      return d.name;
    })
    .on('mouseover', function() {
      //return d3.select(this).attr('style', 'color:blue,text-decoration: underline blue;');
    })
    .on('click', function(d) {
      window.open('http://localhost:3000/asset/' + d.id, '_blank');
      d3.event.stopPropagation();
    })
    .each(wrapRectangle);

  var nodesOnTheLeft = svg.selectAll('g.node').data(nodesLeft);

  var nodeOnLeft = nodesOnTheLeft
    .enter()
    .append('g')
    .attr('transform', function(d) {
      if (d.right === true) {
        return 'translate(' + d.y + ',' + d.x + ')';
      } else {
        return 'translate(' + -1 * d.y + ',' + d.x + ')';
      }
    })
    .on('click', handleNodeClick)
    .on('mouseover', function(d) {
      d3
        .select('.tip')
        .style('visibility', 'visible')
        .style('top', d3.event.pageY + 'px')
        .style('left', d3.event.pageX + 'px')
        .text(d.name);
    })
    .on('mouseout', function(d) {
      d3.select('.tip').style('visibility', 'hidden');
    });

  nodeOnLeft
    .filter(function(d) {
      return d.type == 'SQL' && d.depth > 0;
    })
    .append('circle')
    .attr('cx', function() {
      return -1 * radiusOfCircle;
    })
    .attr('fill', colors.SQL.fill)
    .attr('stroke', colors.SQL.border)
    .attr('stroke-width', strokeWidths.circle)
    .attr('r', function(d) {
      if (d.name === 'outflow') {
        return 0;
      } else {
        return radiusOfCircle;
      }
    });

  nodeOnLeft
    .filter(function(d) {
      return d.type == 'SQL' && d.depth > 0;
    })
    .append('text')
    .attr('x', function() {
      return -radiusOfCircle;
    })
    .attr('y', '0.4em')
    .attr('text-anchor', 'middle')
    .append('tspan')
    .text(function(d) {
      return d.name;
    })
    .on('click', function(d) {
      window.open('http://localhost:3000/asset/' + d.id, '_blank');
      d3.event.stopPropagation();
    })
    .each(wrapCircle);

  nodeOnLeft
    .filter(function(d) {
      return d.type == 'DATASET' && d.depth > 0;
    })
    .append('rect')
    .attr('rx', 3)
    .attr('fill', colors.DATASET.fill)
    .attr('stroke', colors.DATASET.border)
    .attr('stroke-width', strokeWidths.rect)
    .attr('x', function(d) {
      return -1 * widthOfReactangle;
    })
    .attr('y', function(d) {
      return -1 * heightOfRectangle / 2;
    })
    .attr('width', widthOfReactangle)
    .attr('height', heightOfRectangle);

  nodeOnLeft
    .filter(function(d) {
      return d.type == 'DATASET' && d.depth > 0;
    })
    .append('text')
    .attr('x', function() {
      return -1 * (widthOfReactangle / 2);
    })
    .attr('y', function() {
      return 5;
    })
    .attr('text-anchor', 'middle')
    .append('tspan')
    .text(function(d) {
      return d.name;
    })
    .each(wrapRectangle);

  // color all circle's text
  // d3.selectAll('text').attr('fill', 'white');
  d3.selectAll('rect').style('shape-rendering', 'crispEdges');
}
