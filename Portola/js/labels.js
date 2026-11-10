/////////////// Create Hierarchy Labels /////////////

function needsFlip(element) {
	let midAngle = (element.startAngle + element.endAngle) / 2;
	return midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2;
}

function flipArcPath(arcPathString, element) {
	let firstArcSection = /(^.+?)L/;
	let newArc = firstArcSection.exec(arcPathString)[1];
	newArc = newArc.replace(/,/g, " ");

	if (needsFlip(element)) {
		let startLoc = /M(.*?)A/;
		let middleLoc = /A(.*?)([01]) 0 1/;
		let endLoc = /[01] 0 1 (.*?)$/;
		let newStart = endLoc.exec(newArc)[1];
		let newEnd = startLoc.exec(newArc)[1];
		let middleMatch = middleLoc.exec(newArc);
		let middleSec = middleMatch[1];
		let largeArcFlag = middleMatch[2];
		newArc = "M" + newStart + "A" + middleSec + largeArcFlag + " 0 0 " + newEnd;
	}

	return newArc;
}

function selectLevel_textPath(data_element) {
	let archidden = d3.arc()
		.startAngle(data_element.startAngle - 0.3)
		.endAngle(data_element.endAngle + 0.3)
		.innerRadius(data_element.innerRadius)
		.outerRadius(data_element.outerRadius);

	return flipArcPath(archidden(data_element), data_element);
}

function otherLevel_textPath(path_point) {
	let pathPoints = d3.arc()
		.startAngle(path_point.startAngle)
		.endAngle(path_point.endAngle)
		.innerRadius(path_point.innerRadius)
		.outerRadius(path_point.outerRadius)(path_point);

	return flipArcPath(pathPoints, path_point);
}


function get_TextPath(selected_node,label_dataelement){
	let path;
	if(label_dataelement.type === selected_node.type)
		path = selectLevel_textPath(label_dataelement);
	else
		path =  otherLevel_textPath(label_dataelement);
	return path;
}

function gettextLength(data_element){
	let labels = data_element.name.split("XX");
	let label_length = labels[0].length * 6;
	let path_length = (data_element.endAngle - data_element.startAngle)*data_element.outerRadius;
	let label_text;
	if((path_length - label_length) > 0)
		label_text = labels[0];
	else if(path_length > 65){
		label_text = labels[0].substring(0,3) + '...'
	}
	else{
		label_text = '';
	}

	return label_text;
}

function get_LabelTextPath(selected_node,label_dataelement,type,show_type){
	let hierarchy = ['Role','App','Env','Loc']
	let path;
	if(selected_node.type == label_dataelement.type ){
		if(hierarchy.indexOf(type) < hierarchy.indexOf(show_type)){
			path = selectLevel_textPath(label_dataelement);
		}
		else{
			path = otherLevel_textPath(label_dataelement);
		}

	}
	else{
		path =  otherLevel_textPath(label_dataelement);
	}
	return path;
}


function get_WorkloadTextLength(selected_node,data_element){
	let labels = data_element.name.split("XX");
	if(data_element.type === selected_node.type){
		let expanded_path_length = (data_element.endAngle - data_element.startAngle + 0.6) * data_element.outerRadius;
		if (labels[0].length * 6 > expanded_path_length) {
			let maxChars = Math.max(3, Math.floor(expanded_path_length / 6) - 3);
			return labels[0].substring(0, maxChars) + '...';
		}
		return labels[0];
	}
	else
		{ return gettextLength(data_element);}
}

function get_LabelTextLength(selected_node, data_element,type,show_type){
	let labels = data_element.name.split("XX");
	let hierarchy = ['Role','App','Env','Loc']
	if(selected_node.type == data_element.type )
	{
		if(hierarchy.indexOf(type) < hierarchy.indexOf(show_type)){
			let expanded_path_length = (data_element.endAngle - data_element.startAngle + 0.6) * data_element.outerRadius;
			if (labels[0].length * 6 > expanded_path_length) {
				let maxChars = Math.max(3, Math.floor(expanded_path_length / 6) - 3);
				return labels[0].substring(0, maxChars) + '...';
			}
			return labels[0];
		}
			else{
				return gettextLength(data_element);
			}

	}
	else
	{
		return gettextLength(data_element);
	}

}

function show_portlabels(selected_element){
	let sel = d3.select('#' + 'W'+selected_element.name.replace(/\./g,''));
	let e = sel.datum();
	let port_path = sel.node().getAttribute('d');

	let firstArcSection = /(^.+?)A/;
	let newArc = firstArcSection.exec(port_path)[1];
	newArc = newArc.replace(/,/g , " ");
	let startLoc = /M(.*?)0/;
	let radius = parseInt(startLoc.exec(newArc)[1]);
	let node_hover_g = node_g.append("g").attr("class","node_hover");

	let text = node_hover_g.append("text")
		.attr("class", "nodeText")
		.attr("y", e.y-5)
		.attr('x', e.x+radius)
		.text(e.name)
		.style('fill','white')
		.style('font-size',25);

	let bbox = text.node().getBBox();
	node_hover_g.insert("rect","text")
		.attr("width", bbox.width)
		.attr("height", bbox.height)
		.attr("transform", function(){
			return `translate(${e.x+radius},${e.y-bbox.height})`
		})
		.style("fill", "none");
}


/////////////// Create All Fixed Labels /////////////

function get_fixed_labels(){

	let top_arc = d3.arc()
	    .startAngle(-emptyPerc+0.1)
	    .endAngle(emptyPerc-0.1);


	fixedlabels_g.append("path")
	    .attr("id", "top_workload_text")
	    .attr("d", top_arc({
	    		innerRadius: innerRadius,
	    		outerRadius: innerRadius*1.04
		})) //SVG path
	    .style("fill", "none")
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("text")
	    .attr("dy", 30)
	   	.append("textPath")
	   	.attr('class','labels')
	    .attr("xlink:href", "#top_workload_text")
	    .style("text-anchor","middle")
	    .text("Workloads")
	    .attr("startOffset", '25%')
	    .style("font-size",30)
	    .style('fill','white')
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("path")
	    .attr("id", "top_role_text")
	    .attr("d", top_arc({
	    		innerRadius: innerRadius+radiusPadding,
	    		outerRadius: (innerRadius+radiusPadding)*1.04
		})) //SVG path
	    .style("fill", "none")
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("text")
	    .attr("dy", 30)
	   	.append("textPath")
	    .attr("xlink:href", "#top_role_text")
	    .style("text-anchor","middle")
	    .text("Roles")
	    .attr("startOffset", '25%')
	    .style("font-size",30)
	    .style('fill','white')
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("path")
	    .attr("id", "top_app_text")
	    .attr("d", top_arc({
	    		innerRadius: innerRadius+2*radiusPadding,
	    		outerRadius: (innerRadius+2*radiusPadding)*1.04
		})) //SVG path
	    .style("fill", "none")
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("text")
	    .attr("dy", 30)
	   	.append("textPath")
	    .attr("xlink:href", "#top_app_text")
	    .style("text-anchor","middle")
	    .text("Applications")
	     .attr("startOffset", '25%')
	    .style("font-size",30)
	    .style('fill','white')
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("path")
	    .attr("id", "top_env_text")
	    .attr("d", top_arc({
	    		innerRadius: innerRadius+3*radiusPadding,
	    		outerRadius: (innerRadius+3*radiusPadding)*1.04
		})) //SVG path
	    .style("fill", "none")
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("text")
	    .attr("dy", 30)
	   	.append("textPath")
	    .attr("xlink:href", "#top_env_text")
	    .style("text-anchor","middle")
	    .text("Environments")
	     .attr("startOffset", '25%')
	    .style("font-size",30)
	    .style('fill','white')
	    .attr('transform', `translate(${width/2},${height/2})`);


	fixedlabels_g.append("path")
	    .attr("id", "top_loc_text")
	    .attr("d", top_arc({
	    		innerRadius: innerRadius+4*radiusPadding,
	    		outerRadius: (innerRadius+4*radiusPadding)*1.04
		})) //SVG path
	    .style("fill", "none")
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("text")
	    .attr("dy", 30)
	   	.append("textPath")
	    .attr("xlink:href", "#top_loc_text")
	    .style("text-anchor","middle")
	    .text("Locations")
	     .attr("startOffset", '25%')
	    .style("font-size",30)
	    .style('fill','white')
	    .attr('transform', `translate(${width/2},${height/2})`);

	fixedlabels_g.append("text")
	      .text("Source")
	      .attr("x",width/10)
	      .attr("y",150)
	      .style("font-size",40)
	      .style('fill','white')
	      .style("text-anchor","end");

	fixedlabels_g.append("text")
	      .text("Target")
	      .attr("x",(9*width)/10)
	      .attr("y",150)
	      .style("font-size",40)
	      .style('fill','white')
	      .style("text-anchor","end");

}


function createHoverLabel(parentG, groupClass, pathClass, textClass, element, pathFn, textFn) {
	let arcId = "arc" + element.type + "_" + element.name;
	if (document.getElementById(arcId)) return;

	let hoverG = parentG.append("g").attr("class", groupClass);

	hoverG.append("path")
		.attr("class", pathClass)
		.attr("id", arcId)
		.attr("d", pathFn(element))
		.style("fill", "none")
		.attr("transform", positionGroups);

	hoverG.append("text")
		.attr("class", textClass)
		.attr("dy", function() {
			return (needsFlip(element) ? 14 : -5);
		})
		.append("textPath")
		.attr("startOffset", "50%")
		.style("text-anchor", "middle")
		.style('fill', 'white')
		.attr("xlink:href", "#" + arcId)
		.text(textFn(element))
		.attr("transform", positionGroups);
}

function create_labels(e, label) {
	if (label === 'Location') {
		createHoverLabel(location_g, "location_hover", "hiddenLocsParent", "locationText", e, otherLevel_textPath, gettextLength);
	}
}
