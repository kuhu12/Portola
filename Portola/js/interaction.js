/////////////// JSON-MouseOver Creation Utility Functions /////////////

// TYPE , SELECTED_ELEMENT - ARE PROPERTIES OF HOVERED_ELEMENT
function find_linksworkloads(data,workloads,opacity,hovered_type, selected_element){

	let current_selection_links = {};
	let current_selection_nodes = {};

	workloads.forEach(function(d) {
		let keys = workloadToLinkKeys.get(d.name);
		if (!keys) return;
		keys.forEach(function(o) {
			let split = o.split('x');
			if (d.name.includes('Provider')) {
				let con = split[0];
				let port = split[1];
				if (!current_selection_links[`${d.name},${port}`]) { current_selection_links[`${d.name},${port}`] = `${d.name},${port}`; }
				current_selection_links[`${con},${port}`] = `${con},${port}`;
				current_selection_nodes[d.name] = true;
				current_selection_nodes[port] = true;
				current_selection_nodes[con] = true;
			} else {
				let port = split[1];
				let pro = split[2];
				if (!current_selection_links[`${d.name},${port}`]) { current_selection_links[`${d.name},${port}`] = `${d.name},${port}`; }
				current_selection_links[`${pro},${port}`] = `${pro},${port}`;
				current_selection_nodes[d.name] = true;
				current_selection_nodes[port] = true;
				current_selection_nodes[pro] = true;
			}
		});
	});

	let node_keys = new Set(Object.keys(current_selection_nodes));
	let link_keys = new Set(Object.keys(current_selection_links));



	let labels = selected_element.name.split("XX");
	let expanded_path_length = (selected_element.endAngle - selected_element.startAngle + 0.6) * selected_element.outerRadius;
	let hoveredLabel = labels[0];
	if (hoveredLabel.length * 6 > expanded_path_length) {
		let maxChars = Math.max(3, Math.floor(expanded_path_length / 6) - 3);
		hoveredLabel = hoveredLabel.substring(0, maxChars) + '...';
	}
	let arcId = hovered_type == 'Workload' ? 'arcworkload' : 'arclabel';
	let pathClass = hovered_type == 'Workload' ? 'hiddenWorkload' : 'hiddenLabels';
	let e = hovered_type == 'Workload'
		? d3.select('#' + 'W'+selected_element.name.replace(/\./g,'')).datum()
		: d3.select('#' + selected_element.name).datum();

	let node_hover_g = node_g.append("g").attr("class","node_hover");

	node_hover_g.append("path")
		.attr("class", pathClass)
		.attr("id", arcId)
		.attr("d", selectLevel_textPath(selected_element))
		.style("fill", "none")
		.attr("transform", positionGroups);

	node_hover_g.append("text")
		.attr("class", "nodeText")
		.attr("dy", function() {
			return (needsFlip(e) ? 14 : -5);
		})
		.append("textPath")
		.attr("startOffset","50%")
		.style("text-anchor","middle")
		.style('fill','white')
		.attr("xlink:href",'#' + arcId)
		.text(hoveredLabel)
		.attr("transform", positionGroups);




	// Iterate through all nodes, and find out which ones are being highlighted.
	// Pre-seed with the hovered element so we don't create a duplicate label for it.
	// Also restore its arc opacity since the loop will skip it.
	let seenLocs = new Set(), seenEnvs = new Set(), seenApps = new Set(), seenRoles = new Set();
	if (hovered_type === 'Loc') {
		seenLocs.add(selected_element.name);
		d3.select('#' + selected_element.name).style('fill-opacity', 1);
	} else if (hovered_type === 'Env') {
		seenEnvs.add(selected_element.name);
		d3.select('#' + selected_element.name).style('fill-opacity', 1);
	} else if (hovered_type === 'App') {
		seenApps.add(selected_element.name);
		d3.select('#' + selected_element.name).style('fill-opacity', 1);
	} else if (hovered_type === 'Role') {
		seenRoles.add(selected_element.name);
		d3.select('#' + selected_element.name).style('fill-opacity', 1);
	}
	node.style('stroke-opacity', function (o) {
					const inSelection = node_keys.has(o.name);
	        		const thisOpacity = inSelection ? 1 : (o.type === 'Port' ? 0 : opacity);
	     	  		this.setAttribute('fill-opacity', thisOpacity);
	     	  		if(node_keys.has(o.name)){
	     	  				if(o.type == 'Port'){show_portlabels(o);}
	     	  				else {
	     	  				if (!seenLocs.has(o.loc)) {
	     	  					seenLocs.add(o.loc);
	     	  					let locSel = d3.select('#'+o.loc);
	     	  					locSel.style('fill-opacity', 1);
	     	  					createHoverLabel(location_g, "location_hover", "hiddenLocsParent", "locationText", locSel.datum(),
										function(el) { return hovered_type === 'Workload' ? get_TextPath(selected_element, el) : get_LabelTextPath(selected_element, el, hovered_type, 'Loc'); },
										function(el) { return hovered_type === 'Workload' ? get_WorkloadTextLength(selected_element, el) : get_LabelTextLength(selected_element, el, hovered_type, 'Loc'); });
	     	  				}

	     	  				if (!seenEnvs.has(o.env)) {
	     	  					seenEnvs.add(o.env);
	     	  					let envSel = d3.select('#'+o.env);
	     	  					envSel.style('fill-opacity', 1);
	     	  					createHoverLabel(environment_g, "environment_hover", "hiddenEnvsParent", "environmentText", envSel.datum(),
										function(el) { return hovered_type === 'Workload' ? get_TextPath(selected_element, el) : get_LabelTextPath(selected_element, el, hovered_type, 'Env'); },
										function(el) { return hovered_type === 'Workload' ? get_WorkloadTextLength(selected_element, el) : get_LabelTextLength(selected_element, el, hovered_type, 'Env'); });
	     	  				}

	     	  				if (!seenApps.has(o.app)) {
	     	  					seenApps.add(o.app);
	     	  					let appSel = d3.select('#'+o.app);
	     	  					appSel.style('fill-opacity', 1);
	     	  					createHoverLabel(application_g, "application_hover", "hiddenAppsParent", "applicationText", appSel.datum(),
										function(el) { return hovered_type === 'Workload' ? get_TextPath(selected_element, el) : get_LabelTextPath(selected_element, el, hovered_type, 'App'); },
										function(el) { return hovered_type === 'Workload' ? get_WorkloadTextLength(selected_element, el) : get_LabelTextLength(selected_element, el, hovered_type, 'App'); });
	     	  				}

	     	  				if (!seenRoles.has(o.role)) {
	     	  					seenRoles.add(o.role);
	     	  					let roleSel = d3.select('#'+o.role);
	     	  					roleSel.style('fill-opacity', 1);
	     	  					createHoverLabel(application_g, "role_hover", "hiddenRoleParent", "roleText", roleSel.datum(),
										function(el) { return hovered_type === 'Workload' ? get_TextPath(selected_element, el) : get_LabelTextPath(selected_element, el, hovered_type, 'Role'); },
										function(el) { return hovered_type === 'Workload' ? get_WorkloadTextLength(selected_element, el) : get_LabelTextLength(selected_element, el, hovered_type, 'Role'); });
	     	  				}
	     	  				}
	     	  		}
	        		return thisOpacity;
      			});

      			bundlelinks.style('stroke-opacity', function(o){
      				let link_key = `${o[0].name},${o[o.length-1].name}`;
      				return link_keys.has(link_key) ? 0.8 : 0;
			}).style('stroke-width',function(o){
					let link_key = `${o[0].name},${o[o.length-1].name}`;
      				return link_keys.has(link_key) ? 2.5 : 1;
				});;

}

///////////////////////////////////////////////////////////

///////////////// Handle Hover of labels ///////////////////

function handleHover(opacity){
	rolesSelection.style('fill-opacity', opacity);
	environmentsSelection.style('fill-opacity', opacity);
	applicationsSelection.style('fill-opacity', opacity);
	locationsSelection.style('fill-opacity', opacity);
}

///////////////// Handle Hover of Nodes and Links ///////////////////

function handle_nodes_links(){
	node.style('stroke-opacity',function (o) {
	        		const thisOpacity = 1;
	     	  		this.setAttribute('fill-opacity', thisOpacity);
})
	bundlelinks.style('stroke-opacity', 0.8)
	.style('stroke-width',1);
}

///////////////// Remove Labels on MouseOut ///////////////////
function remove_hover_g(){
	d3.selectAll('.role_hover').remove();
	d3.selectAll('.location_hover').remove();
	d3.selectAll('.environment_hover').remove();
	d3.selectAll('.application_hover').remove();
	d3.selectAll('.node_hover').remove();
}
