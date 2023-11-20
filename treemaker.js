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
	if(localStorage.getItem('treeOrientation') == 'landscape'){
          return "translate(" + d.y + "," + d.x + ")";
	} else if (localStorage.getItem('treeOrientation') == 'portrait'){
	  return "translate(" + d.x + "," + d.y + ")";
	}
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
	if(localStorage.getItem('treeOrientation') == 'landscape') {
      path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;
	} else if (localStorage.getItem('treeOrientation') == 'portrait') {
      path = `M ${s.x} ${s.y}
              C ${(s.x + d.x) / 2} ${s.y},
                ${(s.x + d.x) / 2} ${d.y},
                ${d.x} ${d.y}`;
	}

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


// Now you can save jsonString to a file or elsewhere



  function addChild() {
    const name = document.getElementById('nodeName').value;
    if (selectedNode && name) {
     console.log(selectedNode + ' is ' + name);
      if (!selectedNode.data.data.children) {
        selectedNode.data.data.children = [];
        selectedNode.data.data._children = null;
      }
      selectedNode.data.data.children.push({name: name, children: []});
    document.getElementById('nodeName').value = '';
    document.getElementById('nodeName').focus();
    document.getElementById('nodeName').select();

    root = d3.hierarchy(root.data);

    // Recompute the positions of the nodes
    tree(root);
      update(selectedNode.data);
	saveTree();
    }
  }

  document.getElementById('nodeName').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      addChild();
    }
  });

  function deleteNode(d) {
    if (selectedNode.data) {
      if (selectedNode.data.parent) {
	let parentNode = d3.select(selectedNode.data.parent);
        const index = parentNode._groups[0][0].children.indexOf(selectedNode.data);
        if (index > -1) {
	if(parentNode._groups[0][0].children.length > 1){
	console.log(selectedNode.data);
        parentNode._groups[0][0].children.splice(index, 1);
        update(selectedNode.data.parent);
} else {
	selectedNode = { data: selectedNode.data.parent, circle: d3.select(selectedNode.data.parent) };
	selectedNode.data.children = null;
	selectedNode.data._children = null;
	selectedNode.data.data.children = null;
	selectedNode.data.data._children = null;
	update(selectedNode.data.data);
}

    // Recompute the positions of the nodes
        update(root);
          selectedNode = null;
          document.getElementById('deleteButton').disabled = true; // Disable the delete button after deletion
	console.log("testing!");
	saveTree();
        loadTree();
        } else {
	console.log("no Parents");
	}
      }
    }
  }
function saveTree() {
  try {
    let serialized = serializeTree(root);
    const treeData = serialized; // assuming root.data is the full data object for the tree
    const treeJson = JSON.stringify(treeData);
    localStorage.setItem('savedTree', treeJson);
	showToast("Tree Saved Successfully");
  } catch (error) {
    console.error('Failed to save the tree:', error);
	showToast("Error: Tree Couldnt Save");
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
	showToast("Tree Loaded Successfully");
    }
  } catch (error) {
    console.error('Failed to load the tree:', error);
	showToast("Loser");
  }
}

  function renameNode() {
    const name = document.getElementById('nodeName').value;
    console.log(name)
    if (selectedNode && name) {
	console.log("running rename");
      selectedNode.data.data.name = name;
    document.getElementById('nodeName').value = '';
    document.getElementById('nodeName').focus();
    document.getElementById('nodeName').select();

    root = d3.hierarchy(root.data);

    // Recompute the positions of the nodes
    tree(root);
      update(selectedNode.data);
     console.log(selectedNode.data);
	saveTree();
//        loadTree();
	showToast("Node Renamed to " + name);
    }
  }

function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.classList.add('toast');
  toast.textContent = message;
  document.getElementById('toast-container').appendChild(toast);
  // Animation for sliding in
  setTimeout(() => {
    toast.style.opacity = 1;
    toast.style.transform = 'translateX(0)';
  }, 100);

  // Remove the toast after 'duration'
  setTimeout(() => {
    toast.style.opacity = 0;
    toast.style.transform = 'translateX(100%)';
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

document.getElementById('orientationToggle').addEventListener('change', function() {
  let isLandscape = this.checked; // true for landscape, false for portrait
  localStorage.setItem('treeOrientation', isLandscape ? 'landscape' : 'portrait');
 // updateTreeOrientation(isLandscape);
});


// On page load, check the stored preference and set the toggle state
document.addEventListener('DOMContentLoaded', (event) => {
  let storedOrientation = localStorage.getItem('treeOrientation');
  let isLandscape = storedOrientation === 'landscape';
  document.getElementById('orientationToggle').checked = isLandscape;
//  updateTreeOrientation(isLandscape);
});

document.getElementById('saveTreeToFile').addEventListener('click', function() {
  const treeData = localStorage.getItem('savedTree');
  if (treeData) {
    const blob = new Blob([treeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree.json';
    document.body.appendChild(a); // Append to body temporarily
    a.click();
    document.body.removeChild(a); // Remove after download
    URL.revokeObjectURL(url);
  } else {
    alert('No tree data found in localStorage.');
  }
});

document.getElementById('loadTreeFromFile').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file && file.type === "application/json") {
    const reader = new FileReader();
    reader.onload = function(e) {
      const treeData = e.target.result;
      localStorage.setItem('savedTree', treeData);
      // Optionally, you can immediately load the tree after uploading
       loadTree(); // Assuming loadTree is your function to render the tree from localStorage
    };
    reader.readAsText(file);
 
  } else {
    alert('Please upload a valid JSON file.');
  }
});



// Call loadTree() when initializing the visualization to load any saved state

