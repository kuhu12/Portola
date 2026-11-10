/////////////// Force-Layout Utility Functions ////////////

function positionNode(d) {
	return d.type === 'Port' ? `translate(${d.x},${d.y})` : `translate(${width/2},${height/2})` ;
}

function positionGroups(d){
	return `translate(${width/2},${height/2})`;
}

//To fix the postion of nodes after clicking.
function stickNode(event, d) {
	d.fx = d.x;
	d.fy = d.y;
}

function dragstarted(event, d) {
	if(d.type === 'Port'){
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x, d.fy = d.y;
}}


function dragged(event, d) {
	if(d.type === 'Port'){
  		d.fx = event.x, d.fy = event.y;
}}

function dragended(event, d) {
	if(d.type === 'Port'){
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null, d.fy = null;
}}
