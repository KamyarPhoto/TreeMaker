  console.log('beginning');
  let i = 0;
  let treeData = {
    name: "Windows",
    children: []
  };

  let selectedNode = null;
  const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(40,0)"); // Move the tree slightly to the right

  let tree = d3.tree().size([height, width - 160]);
  let root = d3.hierarchy(treeData, function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  update(root);

  function update(source) {
    console.log(root);
//    console.log('1 ' + tree(root));
    const treeData = tree(root);
    const nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

    nodes.forEach(function(d){ d.y = d.depth * 180});

    let node = g.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

    let nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', click);

    // Add circles for the nodes
    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 10)
      .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    // Add labels for the nodes
    nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function(d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function(d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function(d) { return d.data.name; });

    // UPDATE
    let nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
      .duration(500)
      .attr("transform", function(d) { 
          return "translate(" + d.y + "," + d.x + ")";
       });

    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style('fill', function(d, i) { return ["#FFDDC1", "#FFABAB", "#FFC3A0", "#FFAFCC", "#FFFFC3"][d.depth % 5]; })
      .attr('cursor', 'pointer');

    // Remove any exiting nodes
    let nodeExit = node.exit().transition()
      .duration(500)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    nodeExit.select('circle')
      .attr('r', 1e-6);

    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // Update the links...
    let link = g.selectAll('path.link')
      .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    let linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        let o = {x: source.x0, y: source.y0};
        return diagonal(o, o);
      });

    // UPDATE
    let linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(500)
      .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    let linkExit = link.exit().transition()
      .duration(500)
      .attr('d', function(d) {
        let o = {x: source.x, y: source.y};
        return diagonal(o, o);
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;

      return path;
    }

    // Toggle children on click.
    function click(event, d) {
  if (selectedNode) {
    selectedNode.circle.style('stroke', 'none');
  }
  selectedNode = { data: d, circle: d3.select(event.currentTarget).select('circle') };
  selectedNode.circle.style('stroke', 'black').style('stroke-width', '3px');
  document.getElementById('deleteButton').disabled = false; // Enable the delete button
  console.log("Node clicked:", d);
}


console.log(tree(root));


  }

function serializeTree(node) {
  // Create a copy of the node data without parent and children properties
  let nodeCopy = {};
  for (let prop in node.data) {
    if (prop !== 'parent' && prop !== 'children') {
      nodeCopy[prop] = node.data[prop];
    }
  }

  // Recursively serialize the children if they exist
  if (node.children) {
    nodeCopy.children = node.children.map(serializeTree);
  }

  return nodeCopy;
}

// Use this function to serialize the root of the tree before saving
//let serializableTree = serializeTree(root);
//let jsonString = JSON.stringify(serializableTree);

// Now you can save jsonString to a file or elsewhere



  function addChild() {
    const name = document.getElementById('nodeName').value;
    console.log(name)
    if (selectedNode && name) {
     console.log(selectedNode + ' is ' + name);
      if (!selectedNode.data.data.children) {
	console.log('running selectedNodeDataChildren if Statement');
        selectedNode.data.data.children = [];
        selectedNode.data.data._children = null;
      }
      console.log('made it to the push statement');
      selectedNode.data.data.children.push({name: name, children: []});
    document.getElementById('nodeName').value = '';
    document.getElementById('nodeName').focus();
    document.getElementById('nodeName').select();
console.log(selectedNode.data);
console.log(root);

    root = d3.hierarchy(root.data);

    // Recompute the positions of the nodes
    tree(root);
      update(selectedNode.data);
     console.log(selectedNode.data);
	saveTree();
//        loadTree();
    }
  }

  document.getElementById('nodeName').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      addChild();
    }
  });

  function deleteNode() {
    if (selectedNode.data) {
      console.log(selectedNode.data);
      console.log(selectedNode.data.parent);
      if (selectedNode.data.parent) {
	let parentNode = d3.select(selectedNode.data.parent);
	console.log(parentNode);
        const index = parentNode._groups[0][0].children.indexOf(selectedNode.data);
        console.log(selectedNode.data.parent.children);
        console.log(selectedNode.data.data);
        console.log(selectedNode.data.parent.children);
        console.log(index);
        if (index > -1) {
	console.log(selectedNode.data);
        parentNode._groups[0][0].children.splice(index, 1);
	console.log(selectedNode.data);
        update(selectedNode.data.parent);
//        root = d3.hierarchy(root);

    // Recompute the positions of the nodes
        update(root);
//        root = d3.hierarchy(root);
          selectedNode = null;
          document.getElementById('deleteButton').disabled = true; // Disable the delete button after deletion
	console.log("weiners!");
	saveTree();
        loadTree();
        }
      }
    }
console.log('deleted');
  }
function saveTree() {
  try {
    let serialized = serializeTree(root);
    const treeData = serialized; // assuming root.data is the full data object for the tree
    const treeJson = JSON.stringify(treeData);
    localStorage.setItem('savedTree', treeJson);
    console.log('Tree saved successfully!');
  } catch (error) {
    console.error('Failed to save the tree:', error);
  }
}

// Call saveTree() whenever you want to save the state, for example, after adding or deleting nodes

function loadTree() {
  try {
    const treeJson = localStorage.getItem('savedTree');
    if (treeJson) {
      const treeData = JSON.parse(treeJson);
      root = d3.hierarchy(treeData, function(d) { return d.children; });
      root.x0 = height / 2;
      root.y0 = 0;
      update(root);
      console.log('Tree loaded successfully!');
    } else {
      console.log('No saved tree to load.');
    }
  } catch (error) {
    console.error('Failed to load the tree:', error);
  }
}

// Call loadTree() when initializing the visualization to load any saved state

console.log('loaded!');
