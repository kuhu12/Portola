///////////////////////////////////////////////////////////
////////////////////// Create SVG /////////////////////////
///////////////////////////////////////////////////////////

let svg = d3.select("#chart").append("svg")
	.attr("viewBox", `0 0 ${width} ${height}`)


///////////////////////////////////////////////////////////
/////// Create G elements and Global variables ///////////
///////////////////////////////////////////////////////////


let role_g = svg.append('g');
let application_g = svg.append('g');
let environment_g = svg.append('g');
let location_g = svg.append('g');
let fixedlabels_g = svg.append('g');
let bundlelinks, individuallinks, node, cl, pl, groupWidth,size_ports_scale, linkStatusMap;
let node_g;
let rolesSelection, applicationsSelection, environmentsSelection, locationsSelection;
let workloadToLinkKeys;
let child_workloads;
let labelToWorkloads;
let hoverLabels = new Map();

///////////////////////////////////////////////////////////
//////////////// Create Glow Filters  ////////////////////
///////////////////////////////////////////////////////////

//Container for the gradients
let defs = svg.append("defs");

//Filter for the outside glow
let filter = defs.append("filter")
    .attr("id","glow");
filter.append("feGaussianBlur")
    .attr("stdDeviation","3.5")
    .attr("result","coloredBlur");
let feMerge = filter.append("feMerge");
feMerge.append("feMergeNode")
    .attr("in","coloredBlur");
feMerge.append("feMergeNode")
    .attr("in","SourceGraphic");

////////////////////////////////////////////////////////////
////////////////////// Define Force ////////////////////////
////////////////////////////////////////////////////////////

let simulation = d3.forceSimulation()
    .force("charge",d3.forceManyBody().strength(-30))
    .force("link", d3.forceLink().distance(5).strength(0.5))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("y", d3.forceY(height/2).strength(0.5))
   	.force("x", d3.forceX(width/2).strength(0.3))
