////////////////////////////////////////////////////////////
////////////////////// Main Function ///////////////////////
////////////////////////////////////////////////////////////

//clean_1000_random
d3.csv("./data/new_clean_1000.csv").then(function(data) {

/////////////////// Fixed Labels //////////////////////////

	get_fixed_labels();

//////////// Data Preparation for Force Layout /////////////

	let all_data = get_nodeslinks_data(data)
	let nodes_data = all_data.nodes;
	let links_data = all_data.links;
	let link_hash = all_data.link_hash;

	linkStatusMap = new Map();
	let statusPriority = { 'Denied': 3, 'Unknown': 2, 'Allowed': 1 };
	Object.keys(link_hash).forEach(function(key) {
		let row = link_hash[key];
		let flowStatus = row['Flow Status'] || 'Unknown';
		let parts = key.split('x');
		let conLink = parts[0] + ',' + parts[1];
		let proLink = parts[2] + ',' + parts[1];
		[conLink, proLink].forEach(function(lk) {
			let existing = linkStatusMap.get(lk);
			if (!existing || statusPriority[flowStatus] > statusPriority[existing]) {
				linkStatusMap.set(lk, flowStatus);
			}
		});
	});

	workloadToLinkKeys = new Map();
	Object.keys(link_hash).forEach(function(key) {
		let parts = key.split('x');
		[parts[0], parts[2]].forEach(function(name) {
			if (!workloadToLinkKeys.has(name)) workloadToLinkKeys.set(name, []);
			workloadToLinkKeys.get(name).push(key);
		});
	});

	let result_con = nodes_data.filter(obj =>{ return obj.type === "Consumer"})
	let result_pro = nodes_data.filter(obj =>{ return obj.type === "Provider"})
	let result_port = get_ports(data);

/////////////// Calculate the Arc Layout //////////////////

	cl = result_con.length;
	pl = result_pro.length;
	groupWidth = availableCircle/(cl + pl);
	let	con_startAngle = emptyPerc,
		pro_startAngle = 3 * emptyPerc + cl * groupWidth;


/////////////// Get the Angles and Radius for each Level //////////////////


	//////  Consumers /////////

	let nested_data_con = create_nested_data(result_con);
	let ordered_data_con = get_ordered_data(nested_data_con);
	let workload_group_con = create_groups(ordered_data_con[4],con_startAngle,groupWidth,innerRadius,'Consumer','Workload')
	let role_group_con = create_groups(ordered_data_con[3],con_startAngle,groupWidth,innerRadius+radiusPadding,'Consumer','Role')
	let application_group_con = create_groups(ordered_data_con[2],con_startAngle,groupWidth,innerRadius+2*radiusPadding,'Consumer','Application')
	let environment_group_con = create_groups(ordered_data_con[1],con_startAngle,groupWidth,innerRadius+3*radiusPadding,'Consumer','Environment')
	let location_group_con = create_groups(ordered_data_con[0],con_startAngle,groupWidth,innerRadius+4*radiusPadding,'Consumer','Location')

    //////  Providers /////////

    let nested_data_pro = create_nested_data(result_pro);
	let ordered_data_pro = get_ordered_data(nested_data_pro);
	let workload_group_pro = create_groups(ordered_data_pro[4],pro_startAngle,groupWidth,innerRadius,'Provider','Workload')
	let role_group_pro = create_groups(ordered_data_pro[3],pro_startAngle,groupWidth,innerRadius+radiusPadding,'Provider','Role')
	let application_group_pro = create_groups(ordered_data_pro[2],pro_startAngle,groupWidth,innerRadius+2*radiusPadding,'Provider','Application')
	let environment_group_pro = create_groups(ordered_data_pro[1],pro_startAngle,groupWidth,innerRadius+3*radiusPadding,'Provider','Environment')
	let location_group_pro = create_groups(ordered_data_pro[0],pro_startAngle,groupWidth,innerRadius+4*radiusPadding,'Provider','Location')

	//////  Total Consumer and Provider /////////

	let total_nested_data = [...nested_data_con,...nested_data_pro]

	labelToWorkloads = new Map();
	total_nested_data.forEach(function(x) {
		let locWorkloads = [];
		x.values.forEach(function(y) {
			let envWorkloads = [];
			y.values.forEach(function(z) {
				let appWorkloads = [];
				z.values.forEach(function(a) {
					let roleWorkloads = a.values.slice();
					if (!labelToWorkloads.has(a.role)) labelToWorkloads.set(a.role, []);
					labelToWorkloads.get(a.role).push.apply(labelToWorkloads.get(a.role), roleWorkloads);
					appWorkloads.push.apply(appWorkloads, roleWorkloads);
				});
				if (!labelToWorkloads.has(z.app)) labelToWorkloads.set(z.app, []);
				labelToWorkloads.get(z.app).push.apply(labelToWorkloads.get(z.app), appWorkloads);
				envWorkloads.push.apply(envWorkloads, appWorkloads);
			});
			if (!labelToWorkloads.has(y.env)) labelToWorkloads.set(y.env, []);
			labelToWorkloads.get(y.env).push.apply(labelToWorkloads.get(y.env), envWorkloads);
			locWorkloads.push.apply(locWorkloads, envWorkloads);
		});
		if (!labelToWorkloads.has(x.loc)) labelToWorkloads.set(x.loc, []);
		labelToWorkloads.get(x.loc).push.apply(labelToWorkloads.get(x.loc), locWorkloads);
	});

	let total_role_groups = [...role_group_con,...role_group_pro]
    let total_application_groups = [...application_group_con,...application_group_pro]
    let total_environment_groups = [...environment_group_con,...environment_group_pro]
    let total_location_groups = [...location_group_con,...location_group_pro]
	let total_groups = [...workload_group_con,...workload_group_pro,...result_port]
    let source_groups = [...workload_group_con,...workload_group_pro]


//////////////// Data Setup for Force Layout //////////////

    let nodes = total_groups,
		nodeById = new Map(nodes.map(d => [d.name, d])),
  		links = [];

  	links_data.forEach(function(link) {
	    let s = link.source = nodeById.get(link.source),
	        t = link.target = nodeById.get(link.target);
	       	links.push({source: s, target: t});

	});

//////////////// Setting up Scales //////////////

	let port_numbers = result_port.map(d => +d.name)
	let port_extent = d3.extent(port_numbers);
	let forceyScale = d3.scaleLinear().domain(port_extent).range([height/2-300,height/2+300])
	let connection_extent = d3.extent(result_port, d => d.total)
	size_ports_scale = d3.scaleSqrt().domain(connection_extent).range([500,10000])

//////////////// Setting up Visual Elements //////////////

	let d3line = d3.line()
		.x(d => d.x)
		.y(d => d.y)

	let arc = d3.arc()
		.innerRadius(d=>d.innerRadius)
		.outerRadius(d=>d.outerRadius)
		.startAngle(d=> d.startAngle)
		.endAngle(d=> d.endAngle)
		.padAngle(padAngle)


	let cir = d3.symbol().size(d=> size_ports_scale(d.total)).type(d3.symbolCircle);

///////////////// Drawing the Hierarchy ///////////////


	///////////////// Roles ///////////////

	role_g.selectAll(".roles")
	    .data(total_role_groups)
	    .enter().append("path")
		.attr("class", "roles")
		.attr("d", arc)
		.attr("id", d=> d.name)
		.style("filter", "url(#glow)")
		.style('fill','white')
		.on('mouseover',function(event, d){
			if (!bundlingDone) return;
			clearTimeout(hoverTimeout);
			remove_hover_g();
			handleHover(0.1)
			child_workloads = find_children(total_nested_data, d.name);
			find_linksworkloads(link_hash,child_workloads,0.1,'Role',d);
		})
		.on('mouseout',function(){
			if (!bundlingDone) return;
			hoverTimeout = setTimeout(function(){
				remove_hover_g();
				handle_nodes_links();
				handleHover(1);
			}, 40);
		})
		.attr("transform", positionGroups);



	///////////////// Applications ///////////////


	application_g.selectAll(".applications")
	    .data(total_application_groups)
	    .enter().append("path")
		.attr("class", "applications")
		.attr("d", arc)
		.attr("id", d=> d.name)
		.style("filter", "url(#glow)")
		.style('fill','white')
		.on('mouseover',function(event, d){
			if (!bundlingDone) return;
			clearTimeout(hoverTimeout);
			remove_hover_g();
			handleHover(0.1)
			child_workloads = find_children(total_nested_data, d.name);
			find_linksworkloads(link_hash,child_workloads,0.1,'App',d);
		})
		.on('mouseout',function(){
			if (!bundlingDone) return;
			hoverTimeout = setTimeout(function(){
				remove_hover_g();
				handle_nodes_links();
				handleHover(1);
			}, 40);
		})
		.attr("transform", positionGroups);

///////////////// Environment ///////////////

	environment_g.selectAll(".environments")
	    .data(total_environment_groups)
	    .enter().append("path")
		.attr("class", "environments")
		.attr("d", arc)
		.attr("id", d=> d.name)
		.style("filter", "url(#glow)")
		.style('fill','white')
		.on('mouseover',function(event, d){
			if (!bundlingDone) return;
			clearTimeout(hoverTimeout);
			remove_hover_g();
			handleHover(0.1)
			child_workloads =  find_children(total_nested_data, d.name);
			find_linksworkloads(link_hash,child_workloads,0.1,'Env',d);
		})
		.on('mouseout',function(){
			if (!bundlingDone) return;
			hoverTimeout = setTimeout(function(){
				remove_hover_g();
				handle_nodes_links();
				handleHover(1);
			}, 40);
		})
		.attr("transform", positionGroups);

///////////////// Location ///////////////

	location_g.selectAll(".locations")
	    .data(total_location_groups)
	    .enter().append("path")
		.attr("class", "locations")
		.attr("d", arc)
		.attr("id", d=> d.name)
		.style("filter", "url(#glow)")
		.style('fill','white')
		.on('mouseover',function(event, d){
			if (!bundlingDone) return;
			clearTimeout(hoverTimeout);
			remove_hover_g();
			handleHover(0.1)
			child_workloads = find_children(total_nested_data, d.name);
			find_linksworkloads(link_hash,child_workloads,0.1,'Loc',d);
		})
		.on('mouseout',function(){
			if (!bundlingDone) return;
			hoverTimeout = setTimeout(function(){
				remove_hover_g();
				handle_nodes_links();
				handleHover(1);
			}, 40);
		})
		.attr("transform", positionGroups);

	rolesSelection = role_g.selectAll(".roles");
	applicationsSelection = application_g.selectAll(".applications");
	environmentsSelection = environment_g.selectAll(".environments");
	locationsSelection = location_g.selectAll(".locations");

////////////////////////////////////////////////////////////


///////////////// Drawing the nodes and links ///////////////



	let link = svg.append("g")
		.attr("class", "link");

	let straightlink = svg.append('g');

	// Declare the links before to keep them at the back of the nodes
	node_g = svg.append('g');

	// node holds data of all the nodes.
	node = node_g.selectAll(".node")
			    .data(nodes.filter(d => d.name))
			    .enter().append("path")
				.attr("class", "node")
				.attr("id", d=> 'W'+ d.name.replace(/\./g,''))
				.attr("d", d => { return d.type === 'Port' ? cir(d) : arc(d);})
				.style("fill", d => {return d.type === 'Port' ? '#232323' : 'white' ;})
				.style("stroke", d => {return d.type === 'Port' ? 'white' : 'none' ;})
				.style("stroke-width", d => {return d.type === 'Port' ? 2.5 : 0 ;})
				.on('mouseover', function(event, d) {
					if (!bundlingDone) return;
					clearTimeout(hoverTimeout);
					remove_hover_g();
					fade(0.1).call(this, event, d);
				})
				.attr("selected", false)
				.on('mouseout', function(event){
					if (!bundlingDone) return;
					hoverTimeout = setTimeout(function(){
						remove_hover_g();
						handleHover(1);
						handle_nodes_links();
					}, 40);
				})
				.on("click", stickNode)
				.call(d3.drag()
				  .on("start", dragstarted)
				  .on("drag", dragged)
				  .on("end", dragended));

	simulation
  		.nodes(nodes)
  		.on("tick", ticked);

	simulation.force("link")
  		.links(links);

  	simulation.force("collide", d3.forceCollide(d => size_ports_scale(d.total)*9000).radius(90).strength(0.5))
  	simulation.force("y", d3.forceY(d => {if(d.type === 'Port'){return forceyScale(d.name);}}).strength(0.5))


/////////// Fix the Position of Nodes in Arc Layout ///////////

	let middleAngle;
  	for(let i=0; i < source_groups.length; i++)
  	{
  		middleAngle = (nodes[i].startAngle+nodes[i].endAngle-Math.PI)/2;
  		nodes[i].fx = width/2 + nodes[i].innerRadius * Math.cos(middleAngle);
  		nodes[i].fy = height/2 + nodes[i].innerRadius * Math.sin(middleAngle);

  	}

////// Tick function - Called several time to get the position //////

	let bundlingDone = false;

	individuallinks = straightlink.selectAll('line')
		.data(links)
		.enter().append('line')
		.style("stroke", function(d) {
			let lk = d.source.name + ',' + d.target.name;
			return flowStatusColors[linkStatusMap.get(lk) || 'Unknown'];
		})
		.style("stroke-opacity",0.4);

  	function ticked() {

  		if(simulation.alpha()/350 < simulation.alphaMin()){
  			if(!bundlingDone){
  				bundlingDone = true;
  				individuallinks.remove();
  				let simNodes = simulation.nodes();
  				let nodeIndexMap = new Map(simNodes.map(function(n, i) { return [n, i]; }));
  				let fbundling = d3.ForceEdgeBundling()
      				.step_size(0.05)
					.compatibility_threshold(0.9)
			        .nodes(simNodes)
			        .edges(simulation.force('link').links().map(function(edge) {
			            return {
			                source: nodeIndexMap.get(edge.source),
			                target: nodeIndexMap.get(edge.target)
			            }
        			}));

			    let bundleUpdate = link.selectAll('path')
			     	 .data(fbundling())
			    bundleUpdate.exit().remove();
    			bundlelinks = bundleUpdate.merge(bundleUpdate.enter().append('path'))
        			 .attr('d', d3line)
        			 .style('stroke', function(d) {
        			 	let lk = d[0].name + ',' + d[d.length - 1].name;
        			 	let lkRev = d[d.length - 1].name + ',' + d[0].name;
        			 	let status = linkStatusMap.get(lk) || linkStatusMap.get(lkRev) || 'Unknown';
        			 	return flowStatusColors[status];
        			 })
        			 .style('stroke-opacity',0.6);
        	}
        }
        else
        {
    		individuallinks
    			.attr("x1", d=> d.source.x)
                .attr("y1", d=>d.source.y)
                .attr("x2", d=> d.target.x)
                .attr("y2", d=> d.target.y);
		}

  		node.attr("transform", positionNode);
  		if(simulation.alpha() < 0.34){ simulation.stop();}

	}

	////// Mouseover- MouseOut Utility Functions //////

	const linkedByIndex = {};
	links.forEach(d => {
		linkedByIndex[`${d.source.name},${d.target.name}`] = 1;
	});

	function isConnected(a, b) {
		return linkedByIndex[`${b.name},${a.name}`] || a.name === b.name;
	}



	function fade(opacity,action) {
		return (event, d) => {

			if(d.type === 'Port'){
				show_portlabels(d);
				handleHover(0.1);
				let seenLocs = new Set(), seenEnvs = new Set(), seenApps = new Set(), seenRoles = new Set();
      			node.style('stroke-opacity', function (o) {
					const connected = isConnected(d, o);
	        		const thisOpacity = connected ? 1 : (o.type === 'Port' ? 0 : opacity);
	     	  		this.setAttribute('fill-opacity', thisOpacity);
	     	  		if(isConnected(d,o) && o.type !== 'Port'){
	     	  				if (!seenLocs.has(o.loc)) {
	     	  					seenLocs.add(o.loc);
	     	  					let locSel = d3.select('#'+o.loc);
	     	  					locSel.style('fill-opacity', 1);
	     	  					create_labels(locSel.datum(), 'Location');
	     	  				}

	     	  				if (!seenEnvs.has(o.env)) {
	     	  					seenEnvs.add(o.env);
	     	  					let envSel = d3.select('#'+o.env);
	     	  					envSel.style('fill-opacity', 1);
	     	  					createHoverLabel(environment_g, "environment_hover", "hiddenEnvsParent", "environmentText", envSel.datum(), otherLevel_textPath, gettextLength);
	     	  				}

	     	  				if (!seenApps.has(o.app)) {
	     	  					seenApps.add(o.app);
	     	  					let appSel = d3.select('#'+o.app);
	     	  					appSel.style('fill-opacity', 1);
	     	  					createHoverLabel(application_g, "application_hover", "hiddenAppsParent", "applicationText", appSel.datum(), otherLevel_textPath, gettextLength);
	     	  				}

	     	  				if (!seenRoles.has(o.role)) {
	     	  					seenRoles.add(o.role);
	     	  					let roleSel = d3.select('#'+o.role);
	     	  					roleSel.style('fill-opacity', 1);
	     	  					createHoverLabel(application_g, "role_hover", "hiddenRoleParent", "roleText", roleSel.datum(), otherLevel_textPath, gettextLength);
	     	  				}
	     	  		}
	        		return thisOpacity;
      			});

				bundlelinks.style('stroke-opacity', function(o){
	      			return (o[0].name === d.name || o[o.length-1].name === d.name) ? 0.8: opacity-0.8;
				})
				.style('stroke-width',function(o){
					return (o[0].name === d.name || o[o.length-1].name === d.name) ? 2.5: 1;
				});


      		}
      		else {
				handleHover(opacity);
				let workload = [d];
				find_linksworkloads(link_hash,workload,opacity,'Workload',d);
			}
		}

  	}

}).catch(function(error) { throw error; });
